using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper.Territories
{
    internal abstract class Territory
    {
        internal abstract void Forage(string job, string location);

        internal void Cache(string companyName, string jobTitle, string jobHtml)
        {
            var fileName = GetCacheFileName(companyName, jobTitle);
            var filePath = Path.Combine(Utilities.CachePath, fileName);

            File.WriteAllText(filePath, jobHtml);
        }

        internal List<string> TallyCache()
        {
            var files = Directory.GetFiles(Utilities.CachePath);
            var fileNames = files.Select(f => new FileInfo(f).Name).ToList();
            return fileNames;
        }

        internal bool AlreadyCached(string companyName, string jobTitle)
        {
            var fileName = GetCacheFileName(companyName, jobTitle);
            var cachedFiles = TallyCache();
            return cachedFiles.Contains(fileName);
        }

        private string GetCacheFileName(string companyName, string jobTitle)
        {
            companyName = companyName.Replace("-", "");
            jobTitle = jobTitle.Replace("-", "");

            return Utilities.SanitizeFileName($"{companyName} - {jobTitle}.html");
        }
    }
}
