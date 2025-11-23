const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");

class GoogleSheetsService {
  constructor() {
    this.doc = null;
    this.serviceAccountAuth = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize auth - you'll need to add these to your .env file
      this.serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive.file",
        ],
      });

      // Initialize the sheet
      this.doc = new GoogleSpreadsheet(
        process.env.GOOGLE_SHEET_ID,
        this.serviceAccountAuth
      );
      await this.doc.loadInfo();

      this.isInitialized = true;
      console.log("Google Sheets service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Google Sheets service:", error);
      throw error;
    }
  }

  async ensureSheetExists(sheetTitle) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let sheet = this.doc.sheetsByTitle[sheetTitle];

    if (!sheet) {
      // Create new sheet if it doesn't exist
      sheet = await this.doc.addSheet({
        title: sheetTitle,
        headerValues: this.getHeadersForSheet(sheetTitle),
      });
      console.log(`Created new sheet: ${sheetTitle}`);
    }

    return sheet;
  }

  getHeadersForSheet(sheetTitle) {
    const headerMappings = {
      Auth_Signups: [
        "Timestamp",
        "Name",
        "Email",
        "Type",
        "IP_Address",
        "User_Agent",
      ],
      Contact_Forms: [
        "Timestamp",
        "Name",
        "Email",
        "Phone",
        "Course",
        "Subject",
        "Message",
        "Preferred_Contact",
        "Course_Interest",
        "Education",
        "Ready_To_Upskill",
        "Source_Page",
      ],
      Newsletter_Subscriptions: [
        "Timestamp",
        "Email",
        "Source_Page",
        "IP_Address",
      ],
      Resume_Builder_Users: [
        "Timestamp",
        "Name",
        "Email",
        "Resume_ID",
        "Action",
        "Template_Used",
      ],
    };

    return headerMappings[sheetTitle] || ["Timestamp", "Data"];
  }

  async addAuthSignup(data) {
    try {
      const sheet = await this.ensureSheetExists("Auth_Signups");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: data.email || "",
        Type: data.type || "signup", // 'signup' or 'login'
        IP_Address: data.ipAddress || "",
        User_Agent: data.userAgent || "",
      };

      await sheet.addRow(rowData);
      console.log("Auth signup data added to Google Sheets");
      return { success: true };
    } catch (error) {
      console.error("Error adding auth signup to Google Sheets:", error);
      throw error;
    }
  }

  async addContactForm(data) {
    try {
      const sheet = await this.ensureSheetExists("Contact_Forms");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: data.email || "",
        Phone: data.phone || "",
        Course: data.course || "",
        Subject: data.subject || "",
        Message: data.message || "",
        Preferred_Contact: data.preferredContact || "",
        Course_Interest: data.courseInterest || "",
        Education: data.education || "",
        Ready_To_Upskill: data.readyToUpskill || "",
        Source_Page: data.sourcePage || "",
      };

      await sheet.addRow(rowData);
      console.log("Contact form data added to Google Sheets");
      return { success: true };
    } catch (error) {
      console.error("Error adding contact form to Google Sheets:", error);
      throw error;
    }
  }

  async addNewsletterSubscription(data) {
    try {
      const sheet = await this.ensureSheetExists("Newsletter_Subscriptions");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Email: data.email || "",
        Source_Page: data.sourcePage || "",
        IP_Address: data.ipAddress || "",
      };

      await sheet.addRow(rowData);
      console.log("Newsletter subscription added to Google Sheets");
      return { success: true };
    } catch (error) {
      console.error(
        "Error adding newsletter subscription to Google Sheets:",
        error
      );
      throw error;
    }
  }

  async addResumeBuilderActivity(data) {
    try {
      const sheet = await this.ensureSheetExists("Resume_Builder_Users");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: data.email || "",
        Resume_ID: data.resumeId || "",
        Action: data.action || "", // 'created', 'updated', 'downloaded', 'printed'
        Template_Used: data.templateUsed || "",
      };

      await sheet.addRow(rowData);
      console.log("Resume builder activity added to Google Sheets");
      return { success: true };
    } catch (error) {
      console.error(
        "Error adding resume builder activity to Google Sheets:",
        error
      );
      throw error;
    }
  }

  // Utility method to validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Method to get all data from a specific sheet (for admin purposes)
  async getSheetData(sheetTitle, limit = 100) {
    try {
      const sheet = await this.ensureSheetExists(sheetTitle);
      const rows = await sheet.getRows({ limit });

      return rows.map((row) => row.toObject());
    } catch (error) {
      console.error(`Error getting data from sheet ${sheetTitle}:`, error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
