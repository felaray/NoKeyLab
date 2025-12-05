using Microsoft.EntityFrameworkCore;

namespace NoKeyLab.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<StoredCredentialEntity> Credentials { get; set; } = null!;
    public DbSet<StoredChallengeEntity> Challenges { get; set; } = null!;
}
