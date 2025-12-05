using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Fido2NetLib.Objects;

namespace NoKeyLab.Server.Data;

public class StoredCredentialEntity
{
    [Key]
    public int Id { get; set; } // Database ID

    public byte[] UserId { get; set; } = Array.Empty<byte>();

    // Serialized Descriptor
    public string DescriptorJson { get; set; } = "";

    public byte[] PublicKey { get; set; } = Array.Empty<byte>();
    public byte[] UserHandle { get; set; } = Array.Empty<byte>();
    public string Username { get; set; } = "";
    public uint SignatureCounter { get; set; }
    public string CredType { get; set; } = "";
    public DateTime RegDate { get; set; }
    public Guid AaGuid { get; set; }
    
    // Nullable for backward compatibility with existing data
    public string? AuthenticatorAttachment { get; set; } // "platform" | "cross-platform" | null

    // Helper to convert to/from Fido2NetLib object
    public PublicKeyCredentialDescriptor GetDescriptor()
    {
        return JsonSerializer.Deserialize<PublicKeyCredentialDescriptor>(DescriptorJson)!;
    }

    public void SetDescriptor(PublicKeyCredentialDescriptor descriptor)
    {
        DescriptorJson = JsonSerializer.Serialize(descriptor);
    }
}
