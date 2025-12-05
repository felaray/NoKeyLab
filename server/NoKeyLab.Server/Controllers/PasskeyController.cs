using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;

namespace NoKeyLab.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PasskeyController : ControllerBase
{
    private readonly IFido2 _fido2;

    // In-memory storage
    private static readonly ConcurrentDictionary<string, StoredCredential> _credentials = new();
    private static readonly ConcurrentDictionary<string, string> _challenges = new(); // challenge -> optionsJson
    private static readonly List<LoginHistory> _loginHistory = new(); // 登入歷史記錄

    public PasskeyController(IFido2 fido2)
    {
        _fido2 = fido2;
    }

    [HttpPost("register/options")]
    public IActionResult RegisterOptions([FromBody] RegisterRequest request)
    {
        try
        {
            var user = new Fido2User
            {
                DisplayName = request.Username,
                Name = request.Username,
                Id = Encoding.UTF8.GetBytes(request.Username)
            };

            // Get user existing keys (exclude list)
            var excludedCredentials = _credentials.Values
                .Where(c => c.UserId.SequenceEqual(user.Id))
                .Select(c => c.Descriptor)
                .ToList();

            var authenticatorSelection = new AuthenticatorSelection
            {
                UserVerification = UserVerificationRequirement.Preferred
            };

            // Set resident key requirement
            authenticatorSelection.ResidentKey = request.ResidentKey switch
            {
                "required" => ResidentKeyRequirement.Required,
                "preferred" => ResidentKeyRequirement.Preferred,
                _ => ResidentKeyRequirement.Discouraged
            };

            if (!string.IsNullOrEmpty(request.AuthenticatorAttachment))
            {
                authenticatorSelection.AuthenticatorAttachment = request.AuthenticatorAttachment switch
                {
                    "platform" => AuthenticatorAttachment.Platform,
                    "cross-platform" => AuthenticatorAttachment.CrossPlatform,
                    _ => null
                };
            }

            var options = _fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                User = user,
                ExcludeCredentials = excludedCredentials,
                AuthenticatorSelection = authenticatorSelection,
                AttestationPreference = AttestationConveyancePreference.None,
                Extensions = null
            });

            // Store challenge
            var challenge = Base64UrlEncode(options.Challenge);
            _challenges[challenge] = options.ToJson();

            return Ok(options);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("register/verify")]
    public async Task<IActionResult> RegisterVerify([FromBody] RegisterVerifyRequest request)
    {
        try
        {
            var clientResponse = request.Response;

            // Get challenge from client response
            var clientDataJson = Encoding.UTF8.GetString(clientResponse.Response.ClientDataJson);
            var clientData = JsonSerializer.Deserialize<JsonElement>(clientDataJson);
            var challenge = clientData.GetProperty("challenge").GetString();

            // Get and remove options
            if (!_challenges.TryRemove(challenge!, out var optionsJson))
                return BadRequest(new { message = "Session expired / Challenge not found" });

            var options = CredentialCreateOptions.FromJson(optionsJson);

            // Verify
            var success = await _fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
            {
                AttestationResponse = clientResponse,
                OriginalOptions = options,
                IsCredentialIdUniqueToUserCallback = (args, token) =>
                {
                    var isUnique = !_credentials.Values.Any(c => c.Descriptor.Id.SequenceEqual(args.CredentialId));
                    return Task.FromResult(isUnique);
                }
            });

            // Store credential
            var credentialId = Base64UrlEncode(success.Id);
            var newCred = new StoredCredential
            {
                UserId = options.User.Id,
                Descriptor = new PublicKeyCredentialDescriptor(success.Id),
                PublicKey = success.PublicKey,
                UserHandle = options.User.Id,
                Username = options.User.Name,
                SignatureCounter = success.SignCount,
                CredType = "public-key",
                RegDate = DateTime.Now,
                AaGuid = success.AaGuid,
                AuthenticatorAttachment = request.AuthenticatorAttachment
            };

            _credentials[credentialId] = newCred;

            return Ok(success);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("login/options")]
    public IActionResult LoginOptions([FromBody] LoginRequest request)
    {
        try
        {
            var allowedCredentials = _credentials.Values.Select(c => c.Descriptor).ToList();

            var options = _fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = allowedCredentials,
                UserVerification = UserVerificationRequirement.Preferred,
                Extensions = null
            });

            var challenge = Base64UrlEncode(options.Challenge);
            _challenges[challenge] = options.ToJson();

            return Ok(options);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("login/verify")]
    public async Task<IActionResult> LoginVerify([FromBody] AuthenticatorAssertionRawResponse clientResponse)
    {
        try
        {
            // Get challenge from client response
            var clientDataJson = Encoding.UTF8.GetString(clientResponse.Response.ClientDataJson);
            var clientData = JsonSerializer.Deserialize<JsonElement>(clientDataJson);
            var challenge = clientData.GetProperty("challenge").GetString();

            // Get and remove options
            if (!_challenges.TryRemove(challenge!, out var optionsJson))
                return BadRequest(new { message = "Session expired / Challenge not found" });

            var options = AssertionOptions.FromJson(optionsJson);

            // Find credential
            var credEntry = _credentials.FirstOrDefault(c => c.Value.Descriptor.Id.SequenceEqual(clientResponse.RawId));
            if (credEntry.Value == null) return BadRequest(new { message = "Unknown credential" });

            var success = await _fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = clientResponse,
                OriginalOptions = options,
                StoredPublicKey = credEntry.Value.PublicKey,
                StoredSignatureCounter = credEntry.Value.SignatureCounter,
                IsUserHandleOwnerOfCredentialIdCallback = (args, token) => Task.FromResult(true)
            });

            // Update counter
            credEntry.Value.SignatureCounter = success.SignCount;

            // 記錄登入歷史 (含 IP)
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            // 處理代理伺服器轉發的 IP
            if (HttpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                ipAddress = forwardedFor.ToString().Split(',').FirstOrDefault()?.Trim() ?? ipAddress;
            }

            lock (_loginHistory)
            {
                _loginHistory.Add(new LoginHistory
                {
                    Username = credEntry.Value.Username,
                    IpAddress = ipAddress,
                    LoginTime = DateTime.UtcNow,
                    CredentialId = Base64UrlEncode(clientResponse.RawId)
                });
            }

            return Ok(new
            {
                success.CredentialId,
                success.SignCount,
                Username = credEntry.Value.Username
            });
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpGet("credentials")]
    public IActionResult GetCredentials([FromQuery] string? type = null)
    {
        var creds = _credentials.Values.AsEnumerable();

        if (!string.IsNullOrEmpty(type))
        {
            creds = creds.Where(c => c.AuthenticatorAttachment == type);
        }

        var result = creds.Select(c => new StoredCredentialDto
        {
            CredentialId = Base64UrlEncode(c.Descriptor.Id),
            UserId = Base64UrlEncode(c.UserId),
            UserHandle = Base64UrlEncode(c.UserHandle),
            Username = c.Username,
            SignatureCounter = c.SignatureCounter,
            CredType = c.CredType,
            RegDate = c.RegDate,
            AaGuid = c.AaGuid,
            AuthenticatorAttachment = c.AuthenticatorAttachment
        });

        return Ok(result);
    }

    [HttpDelete("credentials/{credentialId}")]
    public IActionResult DeleteCredential(string credentialId)
    {
        if (!_credentials.TryRemove(credentialId, out _))
            return NotFound(new { message = "Credential not found" });

        return Ok(new { message = "Credential deleted" });
    }

    [HttpGet("login-history")]
    public IActionResult GetLoginHistory()
    {
        lock (_loginHistory)
        {
            return Ok(_loginHistory.OrderByDescending(h => h.LoginTime).Take(50));
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // 無狀態設計，此端點僅供前端呼叫以記錄登出事件
        return Ok(new { message = "Logged out" });
    }

    private static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}

public class RegisterRequest
{
    public string Username { get; set; } = "";
    public string? AuthenticatorAttachment { get; set; }
    public string? ResidentKey { get; set; }
}

public class LoginRequest
{
    public string Username { get; set; } = "";
}

public class StoredCredential
{
    public byte[] UserId { get; set; } = Array.Empty<byte>();
    public PublicKeyCredentialDescriptor Descriptor { get; set; } = null!;
    public byte[] PublicKey { get; set; } = Array.Empty<byte>();
    public byte[] UserHandle { get; set; } = Array.Empty<byte>();
    public string Username { get; set; } = "";
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "";
    public DateTime RegDate { get; set; }
    public Guid AaGuid { get; set; }
    public string? AuthenticatorAttachment { get; set; }
}

public class StoredCredentialDto
{
    public string CredentialId { get; set; } = "";
    public string UserId { get; set; } = "";
    public string UserHandle { get; set; } = "";
    public string Username { get; set; } = "";
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "";
    public DateTime RegDate { get; set; }
    public Guid AaGuid { get; set; }
    public string? AuthenticatorAttachment { get; set; }
}

public class RegisterVerifyRequest
{
    public AuthenticatorAttestationRawResponse Response { get; set; } = null!;
    public string? AuthenticatorAttachment { get; set; }
}

public class LoginHistory
{
    public string Username { get; set; } = "";
    public string IpAddress { get; set; } = "";
    public DateTime LoginTime { get; set; }
    public string CredentialId { get; set; } = "";
}
