using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HskTypingWeb.Models
{
    [Table("hsk_words")]
    public class HskWord
    {
        [Key]
        public int Id { get; set; }

        public string Chinese { get; set; } = "";
        public string Pinyin { get; set; } = "";
        public string Pinyin_With_Tone { get; set; } = "";
        public string Japanese_Meaning { get; set; } = "";
        public int Hsk_Level { get; set; }
    }
}
