Guidance for Specifying Reports

# Introduction

|   
---|---  
Inquiring About Reports| Many applications involve generating reports from one or more databases. Exploring the content and format of the reports needed is an important aspect of requirements development. This document suggests specific aspects of reports to ask about and report information to record. A template for recording report specifications is found at the end of this document.  
|   
|   
General Questions to Ask About Reports| 

  * Which reports do you currently use?
  * Which reports are currently generated but are not used?
  * Are there departmental, organizational, or governmental standards to which reports are expected to conform to provide a consistent look and feel or to comply with a regulation? Obtain copies of those standards and examples of current reports that meet them.

  
|   
|   
Data Analysis| When developing requirements for reports, ensure that the data necessary to populate the report is available somewhere within the system or database. Users typically think in terms of generating the outputs they desire, which implies certain inputs and sources that will make the necessary data available. This type of analysis may reveal previously undiscovered requirements. In addition, identify computational business rules that will be applied to generate any computed output data.  
|   
|   
Consider Other Variations| When a user requests a specific type of report, the analyst should suggest variations on that theme. One variation is simply sequencing the data differently, such as providing order-by capability on data elements beyond those the user initially requested. Consider providing the user with tools to specify the column sequence. Another type of variation is to crunch up or drill down. “Crunch up” means to produce a summarized report of aggregated results, possibly including results from another source in the report. “Drill down” means to produce a report with supporting details in addition to summary data.  
|   
|   
Anticipate Growth| Users may request reports based on their initial conceptions of how much data or how many parameters may be involved. However, as systems grow over time an initial report layout that worked well with small quantities of data maybe prove intractable. For example, a columnar layout for a certain number of company divisions might fit nicely on one page. But doubling the number of divisions might lead to awkward page breaks, the need to change from portrait to landscape mode, or the need to show the information for each division down the page (rows) rather than across the page (columns).  
|   
|   
Look for Similarities | Multiple users (or even the same user) may request similar, but not identical, reports. Look for opportunities to merge these variations into a single report that provides enough flexibility to meet the diverse needs without requiring redundant or near-redundant development and maintenance effort. Sometimes the variations can be dealt with as set-up parameters for the report generation, such that a report specified at a higher level of abstraction can meet multiple needs.  
|   
---  
  
# Specifying Reports

|   
---|---  
Report Specification| Following are some questions to explore about each customer-requested report. Store this information in the Data Requirements section in the SRS, as an appendix to the SRS, or in a separate report specification document.

  * What is the purpose of the report?
  * What are the sources of the data?
  * Are any calculations or other data transformations required?
  * What data on the report are most important?
  * How do the recipients of the report use the information?
  * Is the report generated manually? If so, by which user classes?
  * Is the report generated automatically? If so, what are the triggering conditions or events?
  * How frequently is the report generated?
  * What is the typical and maximum size of each report?
  * What is the disposition of the report after it is generated? Is it displayed on the screen, sent to a recipient, or printed automatically? Is it stored or archived somewhere for future retrieval?
  * Are there security or privacy restrictions that limit the access of the report to specific individuals or user classes, or which restrict the data that can be included in the report depending on who is generating it? Identify any relevant business rules concerning security and define those access restrictions.
  * Is there any need for the underlying data of the report to be made available to the user for additional ad hoc reporting?
  * How should the system respond if no data is returned in response to a query when attempting to generate this report? Should the system display a message to that effect, generate an empty report, or what?
  * What type of file should the system create when generating the report (e.g., Crystal Reports)?
  * Can this report be used as a template to generate a set of similar reports?
  * Do you have an estimate of the number of records or record size for storage planning and cost estimates?

  
|   
|   
Static and Dynamic Reports|  _Static_ reports __ print out or display data as of a point in time. _Dynamic_ reports provide an interactive, real-time view of data. The system might provide the user with some input controls so he can quickly change the report parameters. Specify which type of report you are requesting and tailor the requirements accordingly.  
|   
|   
Prototyping Reports| It is often valuable to create a prototype (mock up) of the report that illustrates a possible approach. Prototypes are an excellent way to give customers something tangible to work with and reshape to help clarify and determine how best to meet their needs. If appropriate, include a sample report layout in the requirements documentation to help the developer know what to do. In other situations, the developer will create a sample report layout during design.  
|   
---  
  
# Defining Report Elements

The table below indicates common report elements that could be either specified during requirements elicitation or determined during design. For example, the requirements might specify the contents of the report, while the design process establishes the precise layout and formatting of the report contents. Some of these issues might be handled by following existing report development standards.

Not all of these elements and questions will pertain to every report. Also, there is considerable variation in where report elements might be placed. For example, the report title could appear just on the top of the first page or as a header at the top of every page. Use the information below as a guide to help the Requirements Analyst and Developer fully understand the requirements and design constraints for each report.

|   
---|---  
Report ID| 

  * Number, code, or label used to identify or classify report

  
|   
|   
Report Title| 

  * Name of the report 
  * Positioning of the title on the page
  * Include query parameters used to generate the report (such as date range)?

  
|   
|   
Report Purpose| 

  * Brief description of the project, background, context, or business need that led to this report
  * The business decisions that are made using information in the report
  * The relative priority of implementing this reporting capability
  * User classes who will generate the report or use it to make decisions

  
|   
|   
Data Sources| 

  * The applications, files, databases, or data warehouses from which data will be extracted

  
|   
|   
Frequency and Disposition| 

  * Is the report static or dynamic?
  * How frequently is the report generated: weekly, monthly, on-demand?
  * How much data is accessed, or how many transactions are included, when the report is generated?
  * What conditions or events trigger generation of the report?
  * Will the report be generated automatically? Is manual intervention required?
  * Who will receive the report? How is it made available to them (displayed in an application, sent in email, printed, viewed on a mobile device)?

  
|   
|   
Latency| 

  * How quickly must the report be delivered to users when requested?
  * How current must the data be when the report is run?

  
|   
|   
Visual Layout| 

  * Landscape or portrait
  * Paper size (or type of printer) to be used for hardcopy reports
  * If the report includes graphs, define the type(s) of each graph, its appearance, and parameters: titles, axis scaling and labels, data sources, and so on

  
|   
|   
Header and Footer| The following items are among those that could be positioned somewhere in the report header or footer. For each element included, specify the location on the page and its appearance, including font face, point size, text highlighting, color, case, and text justification. When a title or other content exceeds its allocated space, should it be truncated, word-wrapped to the next line, or what?

  * Report title
  * Page numbering and format (such as "Page x" or "Page x of y")
  * Report notes (such as "The report excludes employees who worked for the company for less than one month.")
  * Report run timestamp
  * Name of the person who generated the report
  * Data source(s), particularly in a data warehousing application that consolidates data from disparate sources
  * Report begin and end dates
  * Organization identification (company name, department, logo, other graphics)
  * Confidentiality statement or copyright notice

  
|   
|   
Report Body| 

  * Record selection criteria (logic for what data to select and what to exclude)
  * Fields to include
  * User-specified text or parameters to customize field labels
  * Column and row heading names and formats: text, font, size, color, highlighting, case, justification
  * Column and row layout of data fields, or graph positioning and parameters for charts or graphs
  * Display format for each field: font, size, color, highlighting, case, justification, alignment, numeric rounding, digits and formatting, special characters ($, %, commas, decimals, leading or trailing pad characters)
  * How numeric and text field overflows should be handled
  * Calculations or other transformations that are performed to generate the data displayed
  * Sort criteria for each field
  * Filter criteria or parameters used to restrict the report query prior to running the report
  * Grouping and subtotals, including formatting of totals or subtotal breakout rows
  * Paging criteria

  
|   
|   
End-of-Report Indicator| Appearance and position of any indicator that appears at the end of the report  
|   
|   
Interactivity| 

  * If the report is dynamic or is generated interactively, what options should the user have to modify the contents or appearance of the initially generated report (expand and collapse views, links to other reports, drill down to data sources)?
  * What is the expected persistence of report settings between report sessions?

  
|   
Security Access Restrictions | Any limitations regarding which individuals, groups, or organizations are permitted to generate or view the report or which data they are permitted to select for inclusion  
|   
  
Report Specification for <Project>

**Version:** 1.0 draft 1

**Prepared by:** _< author>_

**Date Written:** _< date created>_

**Last Update:** _< person who last updated the document and the date of the update>_

# Purpose

<Provide a brief description of the project, background, situation, context, or request that led to the need to create or modify the report(s) specified in this document.>

# Report Description

<Describe the contents and layouts of each report, including changes being made in an existing version of the report. Indicate the conditions that will trigger generating the report (e.g., manual or automatic) the timing of report generation, and the disposition of the report, such as to whom it is sent or where it is stored.>

**Report ID:**|   
---|---  
**Report Title:**|   
**Report Purpose:**|   
**Data Sources:**|   
**Frequency and Disposition:**|   
**Latency:**|   
**Visual Layout:**|   
**Header and Footer:**|   
**Report Body:**|   
**End-of-Report Indicator:**|   
**Interactivity:**|   
**Security Access Restrictions:**|   
  
# Sample Report

<If appropriate, provide a mock-up or a sample of the report, or an illustration of a similar existing report, showing the desired layout.>
