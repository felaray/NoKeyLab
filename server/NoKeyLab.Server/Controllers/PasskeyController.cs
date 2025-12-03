using Fido2NetLib;
using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Linq;

namespace NoKeyLab.Server.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PasskeyController : ControllerBase
{
    private readonly IFido2 _fido2;
    private static readonly List<Fido2User> _users = new(); // In-memory user store
    private static readonly List<StoredCredential> _storedCredentials = new(); // In-memory credential store

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
                Id = Encoding.UTF8.GetBytes(request.Username) // Simplified ID
            };

            // 1. Get user existing keys (exclude list)
            var existingKeys = _storedCredentials
                .Where(c => c.UserId.SequenceEqual(user.Id))
                .Select(c => c.Descriptor)
                .ToList();

            // 2. Create options
            var authenticatorSelection = new AuthenticatorSelection
            {
                ResidentKey = ResidentKeyRequirement.Discouraged,
                UserVerification = UserVerificationRequirement.Preferred
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
                ExcludeCredentials = existingKeys,
                AuthenticatorSelection = authenticatorSelection,
                AttestationPreference = AttestationConveyancePreference.None,
                Extensions = null
            });

            // 3. Store options in session
            HttpContext.Session.SetString("fido2.attestationOptions", options.ToJson());

            return Ok(options);
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPost("register/verify")]
    public async Task<IActionResult> RegisterVerify([FromBody] AuthenticatorAttestationRawResponse clientResponse)
    {
        try
        {
            // 1. Get options from session
            var jsonOptions = HttpContext.Session.GetString("fido2.attestationOptions");
            if (string.IsNullOrEmpty(jsonOptions)) return BadRequest(new { message = "Session expired" });
            var options = CredentialCreateOptions.FromJson(jsonOptions);

            // 2. Verify
            var success = await _fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
            {
                AttestationResponse = clientResponse,
                OriginalOptions = options,
                IsCredentialIdUniqueToUserCallback = async (args, token) =>
                {
                    // Verify if credential ID is unique
                    return await Task.FromResult(!_storedCredentials.Any(c => Enumerable.SequenceEqual<byte>(c.Descriptor.Id, args.CredentialId)));
                }
            });

            // 3. Store credential
            _storedCredentials.Add(new StoredCredential
            {
                UserId = options.User.Id,
                Descriptor = new PublicKeyCredentialDescriptor(success.Id),
                PublicKey = success.PublicKey,
                UserHandle = options.User.Id,
                Username = options.User.Name, // Save Username
                SignatureCounter = success.SignCount,
                CredType = "public-key",
                RegDate = DateTime.Now,
                AaGuid = success.AaGuid
            });

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
            var options = _fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = _storedCredentials.Select(c => c.Descriptor).ToList(),
                UserVerification = UserVerificationRequirement.Preferred,
                Extensions = null
            });

            HttpContext.Session.SetString("fido2.assertionOptions", options.ToJson());

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
            var jsonOptions = HttpContext.Session.GetString("fido2.assertionOptions");
            if (string.IsNullOrEmpty(jsonOptions)) return BadRequest(new { message = "Session expired" });
            var options = AssertionOptions.FromJson(jsonOptions);

            // Fix: Use RawId instead of Id (which is string)
            var cred = _storedCredentials.FirstOrDefault(c => Enumerable.SequenceEqual<byte>(c.Descriptor.Id, clientResponse.RawId));
            if (cred == null) return BadRequest(new { message = "Unknown credential" });

            var success = await _fido2.MakeAssertionAsync(new MakeAssertionParams
            {
                AssertionResponse = clientResponse,
                OriginalOptions = options,
                StoredPublicKey = cred.PublicKey,
                StoredSignatureCounter = cred.SignatureCounter,
                IsUserHandleOwnerOfCredentialIdCallback = async (args, token) =>
                {
                    return await Task.FromResult(true);
                }
            });

            // Update counter
            cred.SignatureCounter = success.SignCount;

            return Ok(new
            {
                success.CredentialId,
                success.SignCount,
                Username = cred.Username
            });
        }
        catch (Exception e)
        {
            return BadRequest(new { message = e.Message });
        }
    }
    [HttpGet("credentials")]
    public IActionResult GetCredentials()
    {
        var credentials = _storedCredentials.Select(c => new StoredCredentialDto
        {
            CredentialId = Base64UrlEncode(c.Descriptor.Id),
            UserId = Base64UrlEncode(c.UserId),
            UserHandle = Base64UrlEncode(c.UserHandle),
            Username = c.Username, // Added Username
            SignatureCounter = c.SignatureCounter,
            CredType = c.CredType,
            RegDate = c.RegDate,
            AaGuid = c.AaGuid
        });

        return Ok(credentials);
    }

    [HttpDelete("credentials/{credentialId}")]
    public IActionResult DeleteCredential(string credentialId)
    {
        var cred = _storedCredentials.FirstOrDefault(c => Base64UrlEncode(c.Descriptor.Id) == credentialId);
        if (cred == null) return NotFound(new { message = "Credential not found" });

        _storedCredentials.Remove(cred);
        return Ok(new { message = "Credential deleted" });
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
    public string Username { get; set; } = ""; // Added Username
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "";
    public DateTime RegDate { get; set; }
    public Guid AaGuid { get; set; }
}

public class StoredCredentialDto
{
    public string CredentialId { get; set; } = "";
    public string UserId { get; set; } = "";
    public string UserHandle { get; set; } = "";
    public string Username { get; set; } = ""; // Added Username
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "";
    public DateTime RegDate { get; set; }
    public Guid AaGuid { get; set; }
}
