
"use strict";
const nodemailer = require("nodemailer");
var pm2 = require('pm2');

var stoppedProcesses = [];
var rocesses = []

pm2.connect(function(err) {
  if (err) {
    console.error(err);
    process.exit(2);
  }
  checkPm2()
});

//Connects to pm2 collects info and disconnects from pm2
function checkPm2(){
  var pm2List = [];
  pm2.list(function(err, result){
    if(err){
      console.log(err);
    } else {
      result.forEach(function(process){
        var watchedPm2 = {
          pid: process.pid,
          name: process.name,
          id: process.pm_id,
          path: process.pm2_env.pm_exec_path,
          status: process.pm2_env.status,
          uptime: process.pm2_env.pm_uptime,
          restartTime: process.pm2_env.restart_time,
          unstable: process.pm2_env.unstable_restarts,
          appLog: process.pm2_env.pm_out_log_path,
          errLog: process.pm2_env.pm_err_log_path
        }
        //console.log(watchedPm2);
        pm2List.push(watchedPm2)
        return pm2List
      });
      pm2.disconnect();
      checkStatus(pm2List);
      setTimeout(checkPm2, 10000);
    }
  });
}

//CHecks Status of The Process
function checkStatus(aa){
  var problems = [];
  var passed = [];
  aa.forEach(function(a){
    if(a.status == "stopped" || a.status == "stopping" || a.status == "errored"){
      problems.push(a);
      return problems;
    } else if(a.status == "online"){
      passed.push(a);
      return passed;
    }
  })
  if(problems.length > 0){
    checkingExisting("failed",problems);
  }
  if(passed.length > 0){
    checkingExisting("passed",passed);
  }
}

//Checks this there an existing issue and checks if that existing issue is working
function checkingExisting(a,b){
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  console.log("checkingExisting() started - "+dateTime);
  var movingOn = [];
  var cleared = [];
  var match = false;
  console.log("checking if process exist and email sent - "+dateTime);
  if(stoppedProcesses.length > 0){
    if(a == "failed"){
      b.forEach(function(preIssue){
        for (var i = 0; i < stoppedProcesses.length; i++) {
          if(stoppedProcesses[i].id == preIssue.id){
            return;
          }
        }
        console.log("match= "+match);
        if(match == false){
          console.log("here pushing issues");
          movingOn.push(preIssue)
          return movingOn;
        }
      })
    } else if (a === "passed"){
      b.forEach(function(passed){
        for (var i = 0; i < stoppedProcesses.length; i++) {
          if(stoppedProcesses[i].id == passed.id){
            cleared.push(passed);
            stoppedProcesses.splice(i,1)
            return cleared, stoppedProcesses
          }
        }
      })

    } else {
      console.log("a: " + a + " / b: " + b);
    }
  } else {
    b.forEach(function(bb){
      if(a === "failed"){
        movingOn.push(bb);
        stoppedProcesses.push(bb)
        return stoppedProcesses
      } else if(a === "passed"){
        //does nothing i know pointless
      } else {
        console.log("a: " + a + " / b: " + bb);
      }
    })
  }
  console.log("movingOn length: "+movingOn.length);
  if(movingOn.length > 0){
    createMessage("failed", movingOn)
  }
  console.log("cleared length: "+cleared.length);
  if(cleared.length > 0){
    createMessage("update", cleared)
  }
}

//Creates the Email Message
function createMessage(a,bb){
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  console.log("createMessage() started - "+dateTime);
  var emailText = '';
  var emailHTML = '<table><thead><tr><th>ID:</th><th>Name:</th><th>Status:</th></tr></thead><tbody>';
  var emailAttach = [];
  bb.forEach(function(b){
    if(a == "failed"){
      var stdlog = {
        filename: b.name + "_StandardLogs.txt",
        path: b.appLog
      }
      var errlog = {
        filename: b.name + "_ErrorLogs.txt",
        path: b.errLog
      }
      emailAttach.push(stdlog);
      emailAttach.push(errlog)
    }
    emailText += "ID: " + b.id + " / name: " + b.name + " / status: " + b.status + "\n";
    emailHTML += "<tr><td>" + b.id + "</td><td>"+ b.name + "</td><td>"+ b.status + "</td></tr>"
  })
  emailHTML += '</tbody></table>';
  main(a,emailText, emailHTML, emailAttach).catch(console.error)
}

//sends email
// async..await is not allowed in global scope, must use a wrapper
async function main(a, text, html, attachment){
  console.log("Sending email");
  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  if(a == "failed"){
    var subject = "Issue with Process(es) // Date: "+dateTime;
  } else {
    var subject = "Process Now Working As Exected // Date: "+dateTime;
  }
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "< smtp >",
    port: port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "< username >",
      pass:  "< Password >"
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"< Place Name Here >"dummy@dummy.com', // sender address
    to: "<Sent To Email Address(es)>", // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html,  // html body
    attachments: attachment
  });

  console.log("Message sent: %s", info.messageId+"  //  Date: "+dateTime);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}
