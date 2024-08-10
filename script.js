const pup = require("puppeteer");
let { id, pass } = require("./secret");
let tab;
let dataFile = require("./data");

async function main() {
    try {
        console.log("Launching browser...");
        let browser = await pup.launch({
            headless: false,
            defaultViewport: false,
            args: ["--start-maximized"]
        });
        console.log("Browser launched");

        let [page] = await browser.pages();
        tab = page;  // Make sure `tab` is assigned properly

        console.log("Navigating to Internshala...");
        await tab.goto("https://internshala.com/");
        console.log("Internshala homepage loaded");

        // Wait for and click the login button
        await tab.waitForSelector(".login-cta", { visible: true });
        console.log("Login button found");
        await tab.click(".login-cta");
        console.log("Clicked login button");

        // Type email and password
        await tab.waitForSelector("#modal_email", { visible: true });
        await tab.type("#modal_email", id);
        console.log("Typed email");

        await tab.waitForSelector("#modal_password", { visible: true });
        await tab.type("#modal_password", pass);
        console.log("Typed password");

        // Submit login form and wait for navigation
        await Promise.all([
            tab.click("#modal_login_submit"),
            tab.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
        console.log("Logged in and navigated");

        // Click on profile dropdown
        await tab.waitForSelector(".nav-link.dropdown-toggle.profile_container .is_icon_header.ic-24-filled-down-arrow", { visible: true });
        await tab.click(".nav-link.dropdown-toggle.profile_container .is_icon_header.ic-24-filled-down-arrow");
        console.log("Clicked profile dropdown");

        // Extract profile options and navigate
        let profileOptions = await tab.$$(".profile_options a");
        console.log("Extracted profile options");

        let appUrls = await Promise.all(profileOptions.slice(0, 11).map(async (ele) => {
            return await tab.evaluate(el => el.getAttribute("href"), ele);
        }));

        await tab.goto(`https://internshala.com${appUrls[1]}`);
        console.log("Navigated to section page");

        await page.waitForSelector('#graduation-tab .ic-16-plus', { visible: true, timeout: 60000 }); // Wait for 60 seconds
        await tab.click("#graduation-tab .ic-16-plus");
        console.log("Clicked add button in graduation section");

        await graduation(dataFile[0]);

        await waitForNextSection();
        await tab.waitForSelector(".next-button", { visible: true });
        await tab.click(".next-button");

        await training(dataFile[0]);

        await waitForNextSection();
        await tab.waitForSelector(".next-button", { visible: true });
        await tab.click(".next-button");

        await tab.waitForSelector(".btn.btn-secondary.skip.skip-button", { visible: true });
        await tab.click(".btn.btn-secondary.skip.skip-button");

        await workSample(dataFile[0]);

        await waitForNextSection();
        await tab.waitForSelector("#save_work_samples", { visible: true });
        await tab.click("#save_work_samples");

        await application(dataFile[0]);

    } catch (error) {
        console.error("Error in main function: ", error);
    }
}

async function graduation(data) {
    try {
        await tab.waitForSelector("#degree_completion_status_pursuing", { visible: true });
        await tab.click("#degree_completion_status_pursuing");

        await tab.waitForSelector("#college", { visible: true });
        await tab.type("#college", data["College"]);

        await tab.waitForSelector("#start_year_chosen", { visible: true });
        await tab.click("#start_year_chosen");
        await tab.waitForSelector(".active-result[data-option-array-index='5']", { visible: true });
        await tab.click(".active-result[data-option-array-index='5']");

        await tab.waitForSelector("#end_year_chosen", { visible: true });
        await tab.click('#end_year_chosen');
        await tab.waitForSelector("#end_year_chosen .active-result[data-option-array-index = '6']", { visible: true });
        await tab.click("#end_year_chosen .active-result[data-option-array-index = '6']");

        await tab.waitForSelector("#degree", { visible: true });
        await tab.type("#degree", data["Degree"]);

        await waitForNextSection();
        await tab.waitForSelector("#stream", { visible: true });
        await tab.type("#stream", data["Stream"]);

        await waitForNextSection();
        await tab.waitForSelector("#performance-college", { visible: true });
        await tab.type("#performance-college", data["Percentage"]);

        await waitForNextSection();
        await tab.click("#college-submit");

    } catch (error) {
        console.error("Error in graduation function: ", error);
    }
}

async function training(data) {
    try {
        await tab.waitForSelector(".experiences-tabs[data-target='#training-modal'] .ic-16-plus", { visible: true });
        await tab.click(".experiences-tabs[data-target='#training-modal'] .ic-16-plus");

        await tab.waitForSelector("#other_experiences_course", { visible: true });
        await tab.type("#other_experiences_course", data["Training"]);

        await waitForNextSection();

        await tab.waitForSelector("#other_experiences_organization", { visible: true });
        await tab.type("#other_experiences_organization", data["Organization"]);

        await waitForNextSection();
        await tab.click("#other_experiences_location_type_label");

        await tab.click("#other_experiences_start_date");

        await waitForNextSection();
        let date = await tab.$$(".ui-state-default[href='#']");
        await date[0].click();
        await tab.click("#other_experiences_is_on_going");

        await tab.waitForSelector("#other_experiences_training_description", { visible: true });
        await tab.type("#other_experiences_training_description", data["description"]);

        await waitForNextSection(2000);
        await tab.click("#training-submit");

    } catch (error) {
        console.error("Error in training function: ", error);
    }
}

async function workSample(data) {
    try {
        await tab.waitForSelector("#other_portfolio_link", { visible: true });
        await tab.type("#other_portfolio_link", data["link"]);
    } catch (error) {
        console.error("Error in workSample function: ", error);
    }
}

async function application(data) {
    try {
        await tab.goto("https://internshala.com/the-grand-summer-internship-fair");

        await tab.waitForSelector(".btn.btn-primary.campaign-btn.view_internship", { visible: true });
        await tab.click(".btn.btn-primary.campaign-btn.view_internship");

        await waitForNextSection(2000);
        await tab.waitForSelector(".view_detail_button", { visible: true });
        let details = await tab.$$(".view_detail_button");
        let detailUrl = await Promise.all(details.slice(0, 3).map(async (ele) => {
            return await tab.evaluate(el => el.getAttribute("href"), ele);
        }));

        for (let url of detailUrl) {
            await apply(url, data);
            await waitForNextSection();
        }

    } catch (error) {
        console.error("Error in application function: ", error);
    }
}

async function apply(url, data) {
    try {
        await tab.goto("https://internshala.com" + url);

        await tab.waitForSelector(".btn.btn-large", { visible: true });
        await tab.click(".btn.btn-large");

        await tab.waitForSelector("#application_button", { visible: true });
        await tab.click("#application_button");

        await tab.waitForSelector(".textarea.form-control", { visible: true });
        let ans = await tab.$$(".textarea.form-control");

        for (let i = 0; i < ans.length; i++) {
            if (i === 0) {
                await ans[i].type(data["hiringReason"]);
            } else if (i === 1) {
                await ans[i].type(data["availability"]);
            } else {
                await ans[i].type(data["rating"]);
            }
            await waitForNextSection();
        }

        await tab.click(".submit_button_container");

    } catch (error) {
        console.error("Error in apply function: ", error);
    }
}

// Helper function to wait before proceeding to the next section
async function waitForNextSection(time = 1000) {
    return new Promise(resolve => setTimeout(resolve, time));
}

main();

