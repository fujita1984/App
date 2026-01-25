using HskTypingWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace HskTypingWeb.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<HskWord> HskWords => Set<HskWord>();
    }
}
