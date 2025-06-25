using Newtonsoft.Json.Linq;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper
{
    internal static class Utilities
    {
        internal static string JobSquirrelRootPath {
            get {
                var cwd = Directory.GetCurrentDirectory();
                var rootDir = cwd.Substring(0, cwd.IndexOf("JobSquirrel") + "JobSquirrel".Length);
                return rootDir; 
            }
        }

        internal static string CachePath {
            get { return Path.Combine(Utilities.JobSquirrelRootPath, "AcornDepot", "Cache"); }
        }

        internal static string SanitizeFileName(string fileName)
        {
            var invalidChars = Path.GetInvalidFileNameChars();
            foreach (char c in invalidChars)
            {
                fileName = fileName.Replace(c, '_');
            }
            return fileName.Trim();
        }

        internal static JObject GetSelectorsJSON()
        {
            var selectorsJSONPath = Path.Combine(JobSquirrelRootPath, "selectors.json");
            return JObject.Parse(File.ReadAllText(selectorsJSONPath));
        }

        internal static Dictionary<string, string> GetSelectorsForSite(string siteName)
        {
            var json = GetSelectorsJSON();
            var siteObject = json["sites"]?[siteName];
            
            if (siteObject == null)
                return new Dictionary<string, string>();
            
            return FlattenJsonLeaves(siteObject);
        }

        private static Dictionary<string, string> FlattenJsonLeaves(JToken token, string prefix = "")
        {
            var result = new Dictionary<string, string>();
            
            if (token.Type == JTokenType.Object)
            {
                foreach (var property in token.Children<JProperty>())
                {
                    var key = string.IsNullOrEmpty(prefix) ? property.Name : $"{prefix}.{property.Name}";
                    var flattened = FlattenJsonLeaves(property.Value, key);
                    foreach (var kvp in flattened)
                        result[kvp.Key] = kvp.Value;
                }
            }
            else if (token.Type == JTokenType.Array)
            {
                // For arrays, just take the first string value if it's a simple array
                if (token.Children().All(child => child.Type == JTokenType.String))
                {
                    result[prefix] = token.First?.ToString() ?? "";
                }
                else
                {
                    for (int i = 0; i < token.Children().Count(); i++)
                    {
                        var flattened = FlattenJsonLeaves(token[i], $"{prefix}[{i}]");
                        foreach (var kvp in flattened)
                            result[kvp.Key] = kvp.Value;
                    }
                }
            }
            else
            {
                var key = prefix.Contains('.') ? prefix.Split('.').Last() : prefix;
                result[key] = token.ToString();
            }
            
            return result;
        }
    }
}
