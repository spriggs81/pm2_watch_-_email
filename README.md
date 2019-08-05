# pm2_watch_-_email
Watches all pm2 processes and emails you once for any not online, if the offline process(es) come online the app email you once to let you know it's online.


Application's Requirements and Setup (current build):

  Hardware Requirements:
    Hard Drive: 26 MB (including node modules)
    CPU requirements: Very Minimal (Very simple and small app)

  Software Dependencies:
    PM2 - PM2 API - http://pm2.keymetrics.io/
    Nodemailer - Send Email -  https://nodemailer.com/about/

  Software Setup:
    Email Address(SMTP, port, username, password, and secure(true/false)
    Setup From Field in Email

Breakdown of App's Function:
The application has a total of 5 functions stored within it.

  checkPm2() - This function connects to pm2, and creates a javascript object for each process and disconnects from pm2

  checkStatus(a) - This function takes the javascript object and checks its status and creates two arrays. One for passed statuses and one for   failed statuses

  checkExisting(a,b) - This function checks if this object was already reported. It also checks if an existing reported failed process is         online again. This will create two arrays for passed and failed message statuses.

  createMessage(a,b) - This function creates the message for failed processes(process with a stopping, stopped, or errored status). It will       also create messages for passed processes(failed processes that are now showing an online status). This will create string variables.
  
  main(a,b,c,d) - This function sends out the email. The email for failed processes will include the Process ID, Process Name, and the Process   Status. The email will also include the standard logs from pm2 and the error logs from pm2. The email for passed processes will include the     Process ID, Process Name, and Process Status (You can include logs by commemting out line 143 & 154)
