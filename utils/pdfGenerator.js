const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

// Transform backend resume data to match frontend template structure
const transformResumeData = (resume) => {
  const fullName = resume.personalInfo?.fullName || resume.name || "Jane Doe";
  
  return {
    name: fullName,
    phone: resume.personalInfo?.phone || "+234 (0) 8123456789",
    email: resume.personalInfo?.email || "johndoe@gmail.com",
    address: resume.personalInfo?.address || "NG 112 oreville",
    linkedin: resume.personalInfo?.linkedin || "",
    website: resume.personalInfo?.website || "",
    bio: resume.personalInfo?.profileSummary || resume.summary || "Explain briefly who you are and your background here in not more than 3 lines.",
    technicalSkills: resume.technicalSkills ? resume.technicalSkills.split(',').map(s => s.trim()) : [
      "Javascript", "Python", "PHP", "UX Designer", "Sql", "Java", "HTML5", "Ruby"
    ],
    softSkills: resume.softSkills ? resume.softSkills.split(',').map(s => s.trim()) : [],
    education: resume.education && resume.education.length > 0 ? {
      degree: resume.education[0].degree || "B.Sc in Computer Science",
      school: resume.education[0].institution || "National Open University of Nigeria",
      location: resume.education[0].educationLocation || "",
      major: resume.education[0].major || "",
      honors: resume.education[0].honors || "",
      coursework: resume.education[0].coursework || "",
      gpa: resume.education[0].gpa || "",
      period: resume.education[0].educationStartDate ? 
        `${resume.education[0].educationStartDate} – ${resume.education[0].educationEndDate || 'Present'}` :
        "2015 – 2019"
    } : {
      degree: "B.Sc in Computer Science",
      school: "National Open University of Nigeria",
      location: "",
      major: "",
      honors: "",
      period: "2015 – 2019"
    },
    certifications: resume.certifications?.map(cert => ({
      name: cert.certName || cert.name || "Product Design",
      org: cert.certOrg || "",
      date: cert.certIssueDate || "",
      credential: cert.certCredential || ""
    })) || [{name: "Product Design"}],
    projects: resume.projects?.map(project => ({
      title: project.projectTitle || "Resume Builder App",
      description: project.projectDescription || "",
      tech: project.projectTech || "",
      role: project.projectRole || "",
      link: project.projectLink || "",
      period: `${project.projectStartDate || ""} – ${project.projectEndDate || ""}`
    })) || [],
    workHistory: resume.experience?.map(exp => ({
      title: exp.jobTitle || exp.position || "Cloud Engineer",
      company: exp.companyName || exp.company || "Yep!, USA",
      location: exp.jobLocation || exp.location || "",
      employmentType: exp.employmentType || "",
      period: `${exp.jobStartDate || exp.startDate || 'March 2022'} – ${exp.current ? 'Present' : (exp.jobEndDate || exp.endDate || 'Present')}`,
      description: exp.jobDescription || exp.description ? [exp.jobDescription || exp.description] : [
        "I am a professional with passion for creating stunning and user-friendly websites and applications."
      ],
      skills: exp.jobSkills || exp.skillsUsed || ""
    })) || [{
      title: "Cloud Engineer",
      company: "Yep!, USA",
      location: "",
      employmentType: "",
      period: "March 2022 – Present",
      description: ["I am a professional with passion for creating stunning and user-friendly websites and applications."],
      skills: ""
    }]
  };
};

// Generate PDF resume from resume data (matching KateBishopResume template)
const generatePDF = async (resume) => {
  try {
    // Validate input
    if (!resume) {
      throw new Error("Resume data is required");
    }

    // Transform data to match template structure
    const data = transformResumeData(resume);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page (A4 size)
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set margins and layout
    const margin = 40;
    const contentWidth = width - 2 * margin;
    let currentY = height - margin;

    // Helper function to add text with word wrapping
    const addWrappedText = (
      text,
      x,
      y,
      maxWidth,
      fontSize,
      fontFamily,
      color = rgb(0, 0, 0)
    ) => {
      if (!text) return y;
      
      const words = text.split(" ");
      let line = "";
      let lineY = y;

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const testWidth = fontFamily.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && i > 0) {
          page.drawText(line.trim(), {
            x,
            y: lineY,
            size: fontSize,
            font: fontFamily,
            color,
          });
          line = words[i] + " ";
          lineY -= fontSize + 4;
        } else {
          line = testLine;
        }
      }

      if (line.trim()) {
        page.drawText(line.trim(), {
          x,
          y: lineY,
          size: fontSize,
          font: fontFamily,
          color,
        });
        lineY -= fontSize + 4;
      }

      return lineY;
    };

    // Draw border
    page.drawRectangle({
      x: margin,
      y: margin,
      width: contentWidth,
      height: height - 2 * margin,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
    });

    // Header section with profile placeholder and name
    const headerY = currentY - 30;
    
    // Profile circle placeholder (emoji-like)
    page.drawCircle({
      x: margin + 50,
      y: headerY - 10,
      size: 25,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    // Add "USER" text in the circle
    page.drawText("USER", {
      x: margin + 35,
      y: headerY - 18,
      size: 8,
      font: boldFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Name
    page.drawText(data.name, {
      x: margin + 90,
      y: headerY,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Contact info
    const contactText = `${data.phone} || ${data.email}`;
    page.drawText(contactText, {
      x: margin + 90,
      y: headerY - 20,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Draw header border
    page.drawLine({
      start: { x: margin, y: headerY - 40 },
      end: { x: margin + contentWidth, y: headerY - 40 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });

    currentY = headerY - 60;

    // Address and Bio section (two columns)
    const leftColX = margin + 20;
    const rightColX = margin + contentWidth / 2 + 10;
    const colWidth = contentWidth / 2 - 30;

    // Address
    page.drawText("Address", {
      x: leftColX,
      y: currentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    currentY = addWrappedText(
      data.address,
      leftColX,
      currentY - 15,
      colWidth,
      10,
      font,
      rgb(0.4, 0.4, 0.4)
    );

    // Bio (right column)
    page.drawText("Bio", {
      x: rightColX,
      y: currentY + 30, // Align with Address header
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    addWrappedText(
      data.bio,
      rightColX,
      currentY + 15,
      colWidth,
      10,
      font,
      rgb(0.4, 0.4, 0.4)
    );

    currentY -= 40;

    // Main content area (two columns)
    const leftMainY = currentY;
    let leftCurrentY = leftMainY;
    let rightCurrentY = leftMainY;

    // Left column - Technical Skills
    page.drawText("Technical Skills", {
      x: leftColX,
      y: leftCurrentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    leftCurrentY -= 20;

    // Skills in two sub-columns
    const skillsPerCol = Math.ceil(data.technicalSkills.length / 2);
    const leftSkillsX = leftColX;
    const rightSkillsX = leftColX + colWidth / 2;
    
    for (let i = 0; i < data.technicalSkills.length; i++) {
      const skill = data.technicalSkills[i];
      const isLeftCol = i < skillsPerCol;
      const x = isLeftCol ? leftSkillsX : rightSkillsX;
      const y = leftCurrentY - (i % skillsPerCol) * 15;
      
      page.drawText(`• ${skill}`, {
        x,
        y,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    leftCurrentY -= (skillsPerCol * 15) + 20;

    // Education
    page.drawText("Education", {
      x: leftColX,
      y: leftCurrentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    leftCurrentY -= 20;

    page.drawText(data.education.degree, {
      x: leftColX,
      y: leftCurrentY,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    leftCurrentY -= 15;

    page.drawText(data.education.school, {
      x: leftColX,
      y: leftCurrentY,
      size: 10,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    leftCurrentY -= 15;

    page.drawText(data.education.period, {
      x: leftColX,
      y: leftCurrentY,
      size: 9,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    leftCurrentY -= 30;

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
      page.drawText("Certification", {
        x: leftColX,
        y: leftCurrentY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftCurrentY -= 20;

      data.certifications.forEach((cert) => {
        page.drawText(`• ${cert}`, {
          x: leftColX,
          y: leftCurrentY,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        leftCurrentY -= 15;
      });
      leftCurrentY -= 10;
    }

    // Awards
    if (data.awards && data.awards.length > 0) {
      page.drawText("Awards", {
        x: leftColX,
        y: leftCurrentY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftCurrentY -= 20;

      data.awards.forEach((award) => {
        page.drawText(`• ${award}`, {
          x: leftColX,
          y: leftCurrentY,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        leftCurrentY -= 15;
      });
      leftCurrentY -= 10;
    }

    // Volunteer Work
    if (data.volunteer && data.volunteer.length > 0) {
      page.drawText("Volunteer Work", {
        x: leftColX,
        y: leftCurrentY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftCurrentY -= 20;

      data.volunteer.forEach((vol) => {
        page.drawText(`• ${vol}`, {
          x: leftColX,
          y: leftCurrentY,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        leftCurrentY -= 15;
      });
      leftCurrentY -= 10;
    }

    // Hobbies
    if (data.hobbies && data.hobbies.length > 0) {
      page.drawText("Hobbies", {
        x: leftColX,
        y: leftCurrentY,
        size: 12,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftCurrentY -= 20;

      data.hobbies.forEach((hobby) => {
        page.drawText(`• ${hobby}`, {
          x: leftColX,
          y: leftCurrentY,
          size: 10,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        leftCurrentY -= 15;
      });
    }

    // Right column - Work History
    page.drawText("Work History", {
      x: rightColX,
      y: rightCurrentY,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    rightCurrentY -= 25;

    data.workHistory.forEach((job) => {
      // Job title and company
      const jobTitle = `${job.title} | ${job.company}`;
      page.drawText(jobTitle, {
        x: rightColX,
        y: rightCurrentY,
        size: 10,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      rightCurrentY -= 15;

      // Location and Employment Type
      const locationAndType = [job.location, job.employmentType].filter(Boolean).join(' | ');
      if (locationAndType) {
        page.drawText(locationAndType, {
          x: rightColX,
          y: rightCurrentY,
          size: 9,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        rightCurrentY -= 12;
      }

      // Period
      page.drawText(job.period, {
        x: rightColX,
        y: rightCurrentY,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      rightCurrentY -= 20;

      // Description
      if (Array.isArray(job.description)) {
        job.description.forEach((desc) => {
          rightCurrentY = addWrappedText(
            desc,
            rightColX,
            rightCurrentY,
            colWidth,
            10,
            font,
            rgb(0.3, 0.3, 0.3)
          );
          rightCurrentY -= 5;
        });
      } else {
        rightCurrentY = addWrappedText(
          job.description,
          rightColX,
          rightCurrentY,
          colWidth,
          10,
          font,
          rgb(0.3, 0.3, 0.3)
        );
      }
      rightCurrentY -= 15;
    });

    // Footer
    page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: margin + 20,
      y: 40,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Serialize the PDF to bytes with proper options
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });

    // Ensure we return a proper Buffer
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

module.exports = { generatePDF };
