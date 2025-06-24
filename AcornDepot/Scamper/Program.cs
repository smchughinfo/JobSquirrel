using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using Scamper.Territories;

IWebDriver GetWebDriver()
{
    var options = new ChromeOptions();

    var userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "User Data");
    options.AddArgument($"--user-data-dir={userDataDir}");
    options.AddArgument("--profile-directory=Default");

    options.AddArgument("--disable-blink-features=AutomationControlled");
    options.AddArgument("--disable-dev-shm-usage");
    options.AddArgument("--no-sandbox");
    options.AddArgument("--disable-extensions");
    options.AddExcludedArgument("enable-automation");
    options.AddAdditionalOption("useAutomationExtension", false);

    var driver = new ChromeDriver(options);
    ((IJavaScriptExecutor)driver).ExecuteScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    driver.Manage().Window.Maximize();
    return driver;
}

var driver = GetWebDriver();
var territories = new List<ITerritory> { new Indeed() };
foreach (var territory in territories)
{
    territory.Forage(driver);
}

Console.WriteLine("All territories foraged");
Console.ReadLine();