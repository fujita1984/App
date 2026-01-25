using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HskTypingWeb.Data;

namespace HskTypingWeb.Controllers
{
    [ApiController]
    [Route("Api")]
    public class ApiController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly Random _random = new();

        public ApiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("HskWords")]
        public async Task<IActionResult> GetHskWords(
            [FromQuery] int level = 1,
            [FromQuery] int? limit = null)
        {
            var words = await _context.HskWords
                .Where(w => w.Hsk_Level == level)
                .ToListAsync();

            if (limit.HasValue && limit.Value < words.Count)
            {
                words = words
                    .OrderBy(_ => _random.Next())
                    .Take(limit.Value)
                    .ToList();
            }

            return Ok(words.Select(w => new
            {
                id = w.Id,
                chinese = w.Chinese,
                pinyin = w.Pinyin,
                pinyin_with_tone = w.Pinyin_With_Tone,
                japanese_meaning = w.Japanese_Meaning,
                hsk_level = w.Hsk_Level
            }));
        }
    }
}
