const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

// Generate PDF resume from resume data
const generatePDF = async (resume) => {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Add a page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Get fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set margins
    const margin = 50;
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
          lineY -= fontSize + 2;
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
        lineY -= fontSize + 2;
      }

      return lineY;
    };

    // Helper function to add section header
    const addSectionHeader = (text, y) => {
      page.drawText(text, {
        x: margin,
        y,
        size: 16,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.6),
      });
      return y - 25;
    };

    // Helper function to add subsection
    const addSubsection = (title, content, y) => {
      // Subsection title
      page.drawText(title, {
        x: margin,
        y,
        size: 12,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });

      let currentY = y - 18;

      // Subsection content
      if (Array.isArray(content)) {
        content.forEach((item) => {
          if (typeof item === "string") {
            currentY = addWrappedText(
              `• ${item}`,
              margin + 20,
              currentY,
              contentWidth - 20,
              10,
              font
            );
          } else if (typeof item === "object") {
            // Handle complex objects (education, experience, etc.)
            Object.entries(item).forEach(([key, value]) => {
              if (value && value.toString().trim()) {
                const displayKey =
                  key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, " $1");
                const displayValue = value.toString();
                currentY = addWrappedText(
                  `${displayKey}: ${displayValue}`,
                  margin + 20,
                  currentY,
                  contentWidth - 20,
                  10,
                  font
                );
              }
            });
          }
          currentY -= 5;
        });
      } else if (typeof content === "string") {
        currentY = addWrappedText(
          content,
          margin + 20,
          currentY,
          contentWidth - 20,
          10,
          font
        );
      }

      return currentY - 10;
    };

    // Header section
    const headerY = currentY;
    page.drawText(resume.name || "Resume", {
      x: margin,
      y: headerY,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });

    currentY = headerY - 30;

    // Contact information
    if (resume.contact) {
      const contactInfo = [];
      if (resume.contact.phone) contactInfo.push(resume.contact.phone);
      if (resume.contact.address) {
        const address = resume.contact.address;
        const addressParts = [
          address.street,
          address.city,
          address.state,
          address.zipCode,
          address.country,
        ].filter(Boolean);
        if (addressParts.length > 0) contactInfo.push(addressParts.join(", "));
      }
      if (resume.contact.linkedin) contactInfo.push(resume.contact.linkedin);
      if (resume.contact.website) contactInfo.push(resume.contact.website);

      if (contactInfo.length > 0) {
        const contactText = contactInfo.join(" | ");
        currentY = addWrappedText(
          contactText,
          margin,
          currentY,
          contentWidth,
          10,
          font,
          rgb(0.4, 0.4, 0.4)
        );
        currentY -= 20;
      }
    }

    // Summary section
    if (resume.summary) {
      currentY = addSectionHeader("Professional Summary", currentY);
      currentY = addWrappedText(
        resume.summary,
        margin,
        currentY,
        contentWidth,
        11,
        font
      );
      currentY -= 20;
    }

    // Skills section
    if (resume.skills && resume.skills.length > 0) {
      currentY = addSectionHeader("Skills", currentY);
      const skillsText = resume.skills.join(", ");
      currentY = addWrappedText(
        skillsText,
        margin,
        currentY,
        contentWidth,
        11,
        font
      );
      currentY -= 20;
    }

    // Experience section
    if (resume.experience && resume.experience.length > 0) {
      currentY = addSectionHeader("Professional Experience", currentY);

      resume.experience.forEach((exp) => {
        // Company and position
        const companyPosition = `${exp.position} at ${exp.company}`;
        page.drawText(companyPosition, {
          x: margin,
          y: currentY,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 18;

        // Date range
        const startDate = new Date(exp.startDate).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const endDate = exp.current
          ? "Present"
          : new Date(exp.endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
        const dateRange = `${startDate} - ${endDate}`;

        page.drawText(dateRange, {
          x: margin,
          y: currentY,
          size: 10,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 15;

        // Description
        currentY = addWrappedText(
          exp.description,
          margin,
          currentY,
          contentWidth,
          10,
          font
        );
        currentY -= 10;

        // Achievements
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement) => {
            currentY = addWrappedText(
              `• ${achievement}`,
              margin + 20,
              currentY,
              contentWidth - 20,
              10,
              font
            );
            currentY -= 5;
          });
        }

        currentY -= 10;
      });
    }

    // Education section
    if (resume.education && resume.education.length > 0) {
      currentY = addSectionHeader("Education", currentY);

      resume.education.forEach((edu) => {
        const degreeInfo = `${edu.degree} in ${edu.field}`;
        page.drawText(degreeInfo, {
          x: margin,
          y: currentY,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 18;

        const institutionInfo = edu.institution;
        page.drawText(institutionInfo, {
          x: margin,
          y: currentY,
          size: 11,
          font: font,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= 15;

        const startDate = new Date(edu.startDate).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        const endDate = edu.endDate
          ? new Date(edu.endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })
          : "Present";
        const dateRange = `${startDate} - ${endDate}`;

        page.drawText(dateRange, {
          x: margin,
          y: currentY,
          size: 10,
          font: font,
          color: rgb(0.5, 0.5, 0.5),
        });
        currentY -= 15;

        if (edu.gpa) {
          page.drawText(`GPA: ${edu.gpa}`, {
            x: margin,
            y: currentY,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          currentY -= 15;
        }

        if (edu.description) {
          currentY = addWrappedText(
            edu.description,
            margin,
            currentY,
            contentWidth,
            10,
            font
          );
          currentY -= 10;
        }

        currentY -= 10;
      });
    }

    // Languages section
    if (resume.languages && resume.languages.length > 0) {
      currentY = addSectionHeader("Languages", currentY);
      const languagesText = resume.languages
        .map((lang) => `${lang.name} (${lang.proficiency})`)
        .join(", ");
      currentY = addWrappedText(
        languagesText,
        margin,
        currentY,
        contentWidth,
        11,
        font
      );
      currentY -= 20;
    }

    // Certifications section
    if (resume.certifications && resume.certifications.length > 0) {
      currentY = addSectionHeader("Certifications", currentY);

      resume.certifications.forEach((cert) => {
        const certInfo = `${cert.name} - ${cert.issuer}`;
        page.drawText(certInfo, {
          x: margin,
          y: currentY,
          size: 11,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 15;

        if (cert.date) {
          const certDate = new Date(cert.date).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          page.drawText(certDate, {
            x: margin,
            y: currentY,
            size: 10,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });
          currentY -= 15;
        }

        if (cert.description) {
          currentY = addWrappedText(
            cert.description,
            margin,
            currentY,
            contentWidth,
            10,
            font
          );
          currentY -= 10;
        }

        currentY -= 5;
      });
    }

    // Projects section
    if (resume.projects && resume.projects.length > 0) {
      currentY = addSectionHeader("Projects", currentY);

      resume.projects.forEach((project) => {
        page.drawText(project.name, {
          x: margin,
          y: currentY,
          size: 12,
          font: boldFont,
          color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 18;

        if (project.description) {
          currentY = addWrappedText(
            project.description,
            margin,
            currentY,
            contentWidth,
            10,
            font
          );
          currentY -= 10;
        }

        if (project.technologies && project.technologies.length > 0) {
          const techText = `Technologies: ${project.technologies.join(", ")}`;
          currentY = addWrappedText(
            techText,
            margin,
            currentY,
            contentWidth,
            10,
            font
          );
          currentY -= 10;
        }

        currentY -= 5;
      });
    }

    // Footer
    const footerY = 30;
    page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
      x: margin,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
  }
};

module.exports = { generatePDF };
