using System.ComponentModel.DataAnnotations;

namespace NoKeyLab.Server.Data;

public class StoredChallengeEntity
{
    [Key]
    public string Challenge { get; set; } = ""; // The Base64Url encoded challenge (nonce)

    public string OptionsJson { get; set; } = ""; // The full JSON options

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
