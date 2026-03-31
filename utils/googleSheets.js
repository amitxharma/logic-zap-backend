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
      console.log("🔄 Initializing Google Sheets service...");

      // Check environment variables
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL is not set in .env");
      }
      if (!process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("GOOGLE_PRIVATE_KEY is not set in .env");
      }
      if (!process.env.GOOGLE_SHEET_ID) {
        throw new Error("GOOGLE_SHEET_ID is not set in .env");
      }

      console.log("✅ Environment variables found");
      console.log(
        "📧 Service Account Email:",
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      );
      console.log("📄 Sheet ID:", process.env.GOOGLE_SHEET_ID);

      // Initialize auth - you'll need to add these to your .env file
      this.serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: [
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/drive.file",
        ],
      });

      console.log("✅ JWT auth created");

      // Initialize the sheet
      this.doc = new GoogleSpreadsheet(
        process.env.GOOGLE_SHEET_ID,
        this.serviceAccountAuth,
      );

      console.log("🔄 Loading spreadsheet info...");
      await this.doc.loadInfo();

      this.isInitialized = true;
      console.log("✅ Google Sheets service initialized successfully");
      console.log("📊 Spreadsheet title:", this.doc.title);
    } catch (error) {
      console.error("❌ Failed to initialize Google Sheets service");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      this.isInitialized = false;
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
        "College_Name",
        "Company_Name",
        "Requirements",
        "Modal_ID",
        "Source_Page",
      ],
      Extras: [
        "Timestamp",
        "Name",
        "Email",
        "Phone",
        "Subject",
        "Preferred_Contact",
        "Course_Interest",
        "Message",
        "Modal_ID",
        "Source_Page",
      ],
      Newsletter_Subscriptions: [
        "Timestamp",
        "Email",
        "Source_Page",
        "IP_Address",
      ],
      Blog: ["Timestamp", "Email", "Source_Page", "IP_Address"],
      Resume_Builder_Users: [
        "Timestamp",
        "Name",
        "Email",
        "Resume_ID",
        "Action",
        "Template_Used",
      ],
      Mentor_Applications: [
        "Timestamp",
        "Name",
        "Email",
        "Phone",
        "Qualification",
        "Experience",
        "Source_Page",
        "Status",
      ],
      Mentor_Booking: [
        "Timestamp",
        "Name",
        "Email",
        "Phone",
        "Qualification",
        "Domain",
        "Experience",
        "Mentor_Name",
        "Mentor_ID",
        "Selected_Slot",
        "Selected_Plan",
        "Plan_Price",
        "Source_Page",
        "Status",
      ],
    };

    // If it's a dynamic modal sheet, use the standard contact form headers
    if (!headerMappings[sheetTitle]) {
      return [
        "Timestamp",
        "Name",
        "Email",
        "Phone",
        "Education",
        "Ready_To_Upskill",
        "Modal_ID",
        "Source_Page",
      ];
    }

    return headerMappings[sheetTitle];
  }

  async addAuthSignup(data) {
    try {
      // GUARD: Only allow 'signup' type - reject 'login' or 'google_login'
      const type = data.type || "signup";
      if (type === "login" || type === "google_login") {
        console.log(
          `Rejected ${type} event - Auth_Signups sheet is for signups only`,
        );
        return { success: false, message: "Only signup events are allowed" };
      }

      const sheet = await this.ensureSheetExists("Auth_Signups");
      const email = data.email || "";

      // DEDUPLICATION: Check if email already exists with type 'signup'
      if (email) {
        const rows = await sheet.getRows();
        const existingSignup = rows.find(
          (row) => row.get("Email") === email && row.get("Type") === "signup",
        );

        if (existingSignup) {
          console.log(`Duplicate signup prevented for email: ${email}`);
          return { success: false, message: "Email already registered" };
        }
      }

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: email,
        Type: type,
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

  async addContactForm(data, modalId = null) {
    try {
      console.log("📝 Received form data:", JSON.stringify(data, null, 2));
      console.log("📝 Received modalId parameter:", modalId);

      // Extract modalId from data if not provided as parameter
      const actualModalId = modalId || data.modalId;
      console.log("📝 Actual modalId to use:", actualModalId);
      console.log("📝 Type of actualModalId:", typeof actualModalId);

      // Check if Google Sheets is configured
      if (
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !process.env.GOOGLE_PRIVATE_KEY ||
        !process.env.GOOGLE_SHEET_ID
      ) {
        console.error("❌ Google Sheets credentials not configured!");
        console.error("Missing:", {
          email: !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          key: !process.env.GOOGLE_PRIVATE_KEY,
          sheetId: !process.env.GOOGLE_SHEET_ID,
        });
        throw new Error("Google Sheets credentials not configured");
      }

      // Determine which sheet to use based on modalId
      let sheetName = "Contact_Forms";

      // Modal ID to Sheet Tab mapping
      const modalSheetMapping = {
        // HOMEPAGE
        HOMEPAGE_BOOK_DEMO: "Home_Page",
        HOME_PAGE_EXPLORE_COURSES: "Home_Page",
        HOMEPAGE_CONTACT_FORM: "Home_Page", // Contact form at bottom of homepage

        // COURSE PAGE - Common Book Demo
        COURSE_BOOK_DEMO: "Course",

        // Campus Immersion Tab
        // CAMPUS_IMMERSION_JOIN_NOW: "Course",
        // CAMPUS_IMMERSION_DOWNLOAD_SYLLABUS: "Course",
        // CAMPUS_IMMERSION_SCHEDULE_SESSION: "Course",
        // CAMPUS_IMMERSION_BOOK_SESSION: "Course",
        // CAMPUS_IMMERSION_JOIN_US_TODAY: "Course",

        // EV Basics Tab
        EV_BASICS_JOIN_NOW: "Course",
        EV_BASICS_DOWNLOAD_SYLLABUS: "Course",
        EV_BASICS_SCHEDULE_SESSION: "Course",
        EV_BASICS_BOOK_SESSION: "Course",
        EV_BASICS_JOIN_US_TODAY: "Course",

        //EV Trending

        EV_TRENDING_JOIN_NOW: "Course",
        EV_TRENDING_DOWNLOAD_SYLLABUS: "Course",
        EV_TRENDING_SCHEDULE_SESSION: "Course",
        EV_TRENDING_BOOK_SESSION: "Course",
        EV_TRENDING_JOIN_US_TODAY: "Course",

        // EV Essentials Tab
        EV_ESSENTIALS_JOIN_NOW: "Course",
        EV_ESSENTIALS_DOWNLOAD_SYLLABUS: "Course",
        EV_ESSENTIALS_SCHEDULE_SESSION: "Course",
        EV_ESSENTIALS_BOOK_SESSION: "Course",
        EV_ESSENTIALS_JOIN_US_TODAY: "Course",

        // EV Intermediate Tab
        EV_INTERMEDIATE_JOIN_NOW: "Course",
        EV_INTERMEDIATE_DOWNLOAD_SYLLABUS: "Course",
        EV_INTERMEDIATE_SCHEDULE_SESSION: "Course",
        EV_INTERMEDIATE_BOOK_SESSION: "Course",
        EV_INTERMEDIATE_JOIN_US_TODAY: "Course",

        // EV Master Tab
        EV_MASTER_JOIN_NOW: "Course",
        EV_MASTER_DOWNLOAD_SYLLABUS: "Course",
        EV_MASTER_SCHEDULE_SESSION: "Course",
        EV_MASTER_BOOK_SESSION: "Course",
        EV_MASTER_JOIN_US_TODAY: "Course",

        // EV Repairing Tab - Main
        EV_REPAIRING_JOIN_NOW: "Course",

        // EV Repairing - Battery Repairing SubTab
        BATTERY_REPAIRING_DOWNLOAD_SYLLABUS: "Course",
        BATTERY_REPAIRING_SCHEDULE_SESSION: "Course",
        BATTERY_REPAIRING_BOOK_SESSION: "Course",
        BATTERY_REPAIRING_JOIN_US_TODAY: "Course",

        // EV Repairing - Charger Repairing SubTab
        CHARGER_REPAIRING_DOWNLOAD_SYLLABUS: "Course",
        CHARGER_REPAIRING_SCHEDULE_SESSION: "Course",
        CHARGER_REPAIRING_BOOK_SESSION: "Course",
        CHARGER_REPAIRING_JOIN_US_TODAY: "Course",

        // EV Repairing - Controller Repairing SubTab
        CONTROLLER_REPAIRING_DOWNLOAD_SYLLABUS: "Course",
        CONTROLLER_REPAIRING_SCHEDULE_SESSION: "Course",
        CONTROLLER_REPAIRING_BOOK_SESSION: "Course",
        CONTROLLER_REPAIRING_JOIN_US_TODAY: "Course",

        // EV Repairing - EV Assembly SubTab
        EV_ASSEMBLY_DOWNLOAD_SYLLABUS: "Course",
        EV_ASSEMBLY_SCHEDULE_SESSION: "Course",
        EV_ASSEMBLY_BOOK_SESSION: "Course",
        EV_ASSEMBLY_JOIN_US_TODAY: "Course",

        // Capsule Courses Tab - Main
        CAPSULE_COURSES_JOIN_NOW: "Course",

        // Capsule Courses - EV Analyst SubTab
        EV_ANALYST_DOWNLOAD_SYLLABUS: "Course",
        EV_ANALYST_SCHEDULE_SESSION: "Course",
        EV_ANALYST_BOOK_SESSION: "Course",
        EV_ANALYST_JOIN_US_TODAY: "Course",

        // Capsule Courses - IoT Dashboard SubTab
        IOT_DASHBOARD_DOWNLOAD_SYLLABUS: "Course",
        IOT_DASHBOARD_SCHEDULE_SESSION: "Course",
        IOT_DASHBOARD_BOOK_SESSION: "Course",
        IOT_DASHBOARD_JOIN_US_TODAY: "Course",

        // Capsule Courses - MATLAB SubTab
        MATLAB_DOWNLOAD_SYLLABUS: "Course",
        MATLAB_SCHEDULE_SESSION: "Course",
        MATLAB_BOOK_SESSION: "Course",
        MATLAB_JOIN_US_TODAY: "Course",

        // Capsule Courses - ANSYS SubTab
        ANSYS_DOWNLOAD_SYLLABUS: "Course",
        ANSYS_SCHEDULE_SESSION: "Course",
        ANSYS_BOOK_SESSION: "Course",
        ANSYS_JOIN_US_TODAY: "Course",

        // Capsule Courses - Battery Diagnostic SubTab
        BATTERY_DIAGNOSTIC_DOWNLOAD_SYLLABUS: "Course",
        BATTERY_DIAGNOSTIC_SCHEDULE_SESSION: "Course",
        BATTERY_DIAGNOSTIC_BOOK_SESSION: "Course",
        BATTERY_DIAGNOSTIC_JOIN_US_TODAY: "Course",

        // Capsule Courses - Embedded Systems SubTab
        EMBEDDED_SYSTEMS_DOWNLOAD_SYLLABUS: "Course",
        EMBEDDED_SYSTEMS_SCHEDULE_SESSION: "Course",
        EMBEDDED_SYSTEMS_BOOK_SESSION: "Course",
        EMBEDDED_SYSTEMS_JOIN_US_TODAY: "Course",

        // Capsule Courses - PCB Designing SubTab
        PCB_DESIGNING_DOWNLOAD_SYLLABUS: "Course",
        PCB_DESIGNING_SCHEDULE_SESSION: "Course",
        PCB_DESIGNING_BOOK_SESSION: "Course",
        PCB_DESIGNING_JOIN_US_TODAY: "Course",

        // // Placement Page
        // PLACEMENT_BOOK_DEMO: "Placement",

        // SERVICES PAGE
        // Top Banner Buttons (Dynamic per tab)
        SERVICES_BOOK_DEMO: "Services",
        SERVICES_CONTACT_US: "Services",
        SERVICES_CORPORATE_CONTACT_US: "Services",
        SERVICES_BUSINESS_CONTACT_US: "Services",

        // Learners Tab (Tab 0)
        LEARNERS_HEROSECTION_CONNECT_WITH_US: "Services",
        LEARNERS_JOIN_US_TODAY: "Services",
        LEARNERS_REQUEST_TO_CALL: "Services",

        // Colleges Tab (Tab 1)
        COLLEGES_HEROSECTION_CONNECT_WITH_US: "Services",
        COLLEGES_JOIN_US_TODAY: "Services",
        COLLEGES_REQUEST_TO_CALL: "Services",

        // Corporates Tab (Tab 2)
        CORPORATES_HEROSECTION_CONNECT_WITH_US: "Services",
        CORPORATES_JOIN_US_TODAY: "Services",
        CORPORATES_REQUEST_TO_CALL: "Services",

        // Businesses Tab (Tab 3)
        BUSINESSES_HEROSECTION_CONNECT_WITH_US: "Services",
        BUSINESSES_JOIN_US_TODAY: "Services",
        BUSINESSES_REQUEST_TO_CALL: "Services",

        // MOCK INTERVIEW PAGE
        MOCK_INTERVIEW_BOOK_DEMO: "MockInterview",

        // CAREER JUMP PAGE
        CAREER_JUMP_BOOK_DEMO: "Career-Jump",
        CAREER_JUMP_START_TRANSFORMATION_HERO: "Career-Jump",
        CAREER_JUMP_START_TRANSFORMATION_FOOTER: "Career-Jump",

        // CORPORATE SERVICES PAGES
        LAB_SETUP_CONTACT_US: "LabSetup",
        LAB_SETUP_BOOK_CONSULTATION: "LabSetup",

        STUDENT_TRAINING_CONTACT_US: "StudentTrainingProgram",
        STUDENT_TRAINING_BOOK_CONSULTATION: "StudentTrainingProgram",

        FACULTY_DEVELOPMENT_CONTACT_US: "FacultyDevelopmentProgram",
        FACULTY_DEVELOPMENT_BOOK_CONSULTATION: "FacultyDevelopmentProgram",

        HIRING_SOLUTIONS_CONTACT_US: "HiringSolutions",
        HIRING_SOLUTIONS_BOOK_CONSULTATION: "HiringSolutions",

        CONTRACT_MANPOWER_CONTACT_US: "ContractManpower",
        CONTRACT_MANPOWER_BOOK_CONSULTATION: "ContractManpower",

        EMPLOYEE_TRAINING_CONTACT_US: "EmployeeTraining",
        EMPLOYEE_TRAINING_BOOK_CONSULTATION: "EmployeeTraining",

        DIGITAL_MARKETING_CONTACT_US: "DigitalMarketing",
        DIGITAL_MARKETING_BOOK_CONSULTATION: "DigitalMarketing",

        SKILLED_MANPOWER_CONTACT_US: "SkilledManpower",
        SKILLED_MANPOWER_BOOK_CONSULTATION: "SkilledManpower",

        FRANCHISE_SETUP_CONTACT_US: "FranchiseSetup",
        FRANCHISE_SETUP_BOOK_CONSULTATION: "FranchiseSetup",

        // PLACEMENT PAGE
        PLACEMENT_BOOK_DEMO: "Placement",
        PLACEMENT_APPLY_FOR_PLACEMENT: "Placement",
        PLACEMENT_START_JOURNEY: "Placement",
        PLACEMENT_CONNECT_WITH_AN_EXPERT: "Placement",

        // CONTACT PAGE
        // CONTACT_SCHEDULE_CAMPUS_TOUR: "Contact",
        CONTACT_SCHEDULE_CAMPUS_TOUR_BOOK_VISIT: "Contact",
        CONTACT_SCHEDULE_CAMPUS_TOUR_SCHEDULE_TOUR: "Contact",

        // CORPORATE SERVICES PAGES - Contact Forms
        LAB_SETUP_CONTACT_FORM: "LabSetup",
        STUDENT_TRAINING_CONTACT_FORM: "StudentTrainingProgram",
        FACULTY_DEVELOPMENT_CONTACT_FORM: "FacultyDevelopmentProgram",
        HIRING_SOLUTIONS_CONTACT_FORM: "HiringSolutions",
        CONTRACT_MANPOWER_CONTACT_FORM: "ContractManpower",
        EMPLOYEE_TRAINING_CONTACT_FORM: "EmployeeTraining",
        DIGITAL_MARKETING_CONTACT_FORM: "DigitalMarketing",
        SKILLED_MANPOWER_CONTACT_FORM: "SkilledManpower",
        FRANCHISE_SETUP_CONTACT_FORM: "FranchiseSetup",

        // MENTOR FILTER
        MENTOR_FILTER: "Explore_Mentor",

        // EXTRAS PAGES
        PLACEMENTS_CONTACT_FORM: "Placement",
        BLOG_CONTACT_FORM: "Extras",
        CONTACT_PAGE_FORM: "Extras",
      };

      // Use specific sheet if modalId is provided and mapped
      console.log("🔍 Checking mapping for modalId:", actualModalId);
      console.log("🔍 Mapping exists?", modalSheetMapping[actualModalId]);

      if (actualModalId && modalSheetMapping[actualModalId]) {
        sheetName = modalSheetMapping[actualModalId];
        console.log(
          `📊 Routing to sheet: ${sheetName} (from modalId: ${actualModalId})`,
        );
      } else {
        console.log(
          `⚠️  No mapping found for modalId: ${actualModalId}, using default: ${sheetName}`,
        );
      }

      console.log("🔄 Ensuring sheet exists...");
      const sheet = await this.ensureSheetExists(sheetName);
      console.log("✅ Sheet ready:", sheetName);

      // Build row data based on sheet type
      let rowData;

      if (sheetName === "Contact_Forms") {
        // Contact Forms sheet with all fields
        rowData = {
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
          College_Name: data.collegeName || "",
          Company_Name: data.companyName || "",
          Requirements: data.requirements || "",
          Modal_ID: actualModalId || "",
          Source_Page: data.sourcePage || "",
        };
      } else if (sheetName === "Extras") {
        // Extras sheet for Placements, Blog, Contact pages
        rowData = {
          Timestamp: new Date().toISOString(),
          Name: data.name || "",
          Email: data.email || "",
          Phone: data.phone || "",
          Subject: data.subject || "",
          Preferred_Contact: data.preferredContact || "",
          Course_Interest: data.courseInterest || "",
          Message: data.message || "",
          Modal_ID: actualModalId || "",
          Source_Page: data.sourcePage || "",
        };
      } else {
        // Dynamic modal sheets with clean, organized fields
        rowData = {
          Timestamp: new Date().toISOString(),
          Name: data.name || "",
          Email: data.email || "",
          Phone: data.phone || "",
          Education: data.education || "",
          Ready_To_Upskill: data.readyToUpskill || "",
          Modal_ID: actualModalId || "",
          Source_Page: data.sourcePage || "",
        };
      }

      console.log("📝 Row data to add:", JSON.stringify(rowData, null, 2));
      console.log("🔄 Adding row to sheet...");

      await sheet.addRow(rowData);

      console.log(
        `✅ SUCCESS! Form submitted to sheet: ${sheetName} | Modal ID: ${actualModalId}`,
      );
      return { success: true, sheetName, modalId: actualModalId };
    } catch (error) {
      console.error("❌ ERROR adding contact form to Google Sheets:");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error:", error);
      throw error;
    }
  }

  async addNewsletterSubscription(data) {
    try {
      // Check if this is from the blog page
      const isBlogPage = data.sourcePage && data.sourcePage.includes("/blog");
      const sheetName = isBlogPage ? "Blog" : "Newsletter_Subscriptions";

      const sheet = await this.ensureSheetExists(sheetName);

      const rowData = {
        Timestamp: new Date().toISOString(),
        Email: data.email || "",
        Source_Page: data.sourcePage || "",
        IP_Address: data.ipAddress || "",
      };

      await sheet.addRow(rowData);
      console.log(
        `${
          isBlogPage ? "Blog" : "Newsletter"
        } subscription added to Google Sheets (${sheetName})`,
      );
      return { success: true };
    } catch (error) {
      console.error(
        "Error adding newsletter subscription to Google Sheets:",
        error,
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
        error,
      );
      throw error;
    }
  }

  async addMentorApplication(data) {
    try {
      console.log("📝 Adding mentor application to Google Sheets...");
      const sheet = await this.ensureSheetExists("Mentor_Applications");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: data.email || "",
        Phone: data.phone || "",
        Qualification: data.qualification || "",
        Experience: data.experience || "",
        Source_Page: data.sourcePage || "",
        Status: "Pending Review",
      };

      await sheet.addRow(rowData);
      console.log("✅ Mentor application added to Google Sheets successfully");
      return { success: true };
    } catch (error) {
      console.error(
        "❌ Error adding mentor application to Google Sheets:",
        error,
      );
      throw error;
    }
  }

  async addMentorBooking(data) {
    try {
      console.log("📝 Adding mentor booking to Google Sheets...");
      const sheet = await this.ensureSheetExists("Mentor_Booking");

      const rowData = {
        Timestamp: new Date().toISOString(),
        Name: data.name || "",
        Email: data.email || "",
        Phone: data.phone || "",
        Qualification: data.qualification || "",
        Domain: data.domain || "",
        Experience: data.experience || "",
        Mentor_Name: data.mentorName || "",
        Mentor_ID: data.mentorId || "",
        Selected_Slot: data.selectedSlot || "",
        Selected_Plan: data.selectedPlan || "",
        Plan_Price: data.planPrice || "",
        Source_Page: data.sourcePage || "",
        Status: "Pending Confirmation",
      };

      await sheet.addRow(rowData);
      console.log("✅ Mentor booking added to Google Sheets successfully");
      return { success: true };
    } catch (error) {
      console.error("❌ Error adding mentor booking to Google Sheets:", error);
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

  /**
   * ONE-TIME CLEANUP UTILITY
   * Cleans up the Auth_Signups sheet by:
   * 1. Removing all rows where Type is 'login' or 'google_login'
   * 2. Removing duplicate signups, keeping only the earliest timestamp for each email
   *
   * Usage: Call this function manually via a script or API endpoint
   */
  async cleanupAuthSignupsSheet() {
    try {
      console.log("🧹 Starting Auth_Signups sheet cleanup...");
      const sheet = await this.ensureSheetExists("Auth_Signups");
      const rows = await sheet.getRows();

      let deletedLogins = 0;
      let deletedDuplicates = 0;
      const seenEmails = new Map(); // email -> { row, timestamp }

      // First pass: Delete all login entries
      for (const row of rows) {
        const type = row.get("Type");
        if (type === "login" || type === "google_login") {
          await row.delete();
          deletedLogins++;
          console.log(`Deleted ${type} entry`);
        }
      }

      // Refresh rows after deletion
      const remainingRows = await sheet.getRows();

      // Second pass: Handle duplicates - keep earliest timestamp
      for (const row of remainingRows) {
        const email = row.get("Email");
        const timestamp = row.get("Timestamp");
        const type = row.get("Type");

        if (type === "signup" && email) {
          if (seenEmails.has(email)) {
            const existing = seenEmails.get(email);
            const existingTime = new Date(existing.timestamp);
            const currentTime = new Date(timestamp);

            // Keep the earlier entry, delete the later one
            if (currentTime < existingTime) {
              // Current is earlier, delete the existing one
              await existing.row.delete();
              seenEmails.set(email, { row, timestamp });
              deletedDuplicates++;
              console.log(
                `Deleted duplicate signup for ${email} (kept earlier entry)`,
              );
            } else {
              // Existing is earlier, delete current
              await row.delete();
              deletedDuplicates++;
              console.log(
                `Deleted duplicate signup for ${email} (kept earlier entry)`,
              );
            }
          } else {
            seenEmails.set(email, { row, timestamp });
          }
        }
      }

      const summary = {
        success: true,
        deletedLogins,
        deletedDuplicates,
        totalDeleted: deletedLogins + deletedDuplicates,
        remainingSignups: seenEmails.size,
      };

      console.log("✅ Cleanup completed:", summary);
      return summary;
    } catch (error) {
      console.error("❌ Error during Auth_Signups cleanup:", error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
