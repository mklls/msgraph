# MSGraph Demo

## Installation

<!-- 
1. clone this repo
2. create a copy for .env.example, rename it to .env
3. change the values of the file to your own
4. modify the schedule in your favor, then add it to cron
5. enjoy
-->

Before you start, you should add the following *application permissions* to your app:

- User.ReadWrite.All
- Sites.FullControl.All
- Mail.Send
- Mail.ReadWrite
- MailboxSettings.ReadWrite
- Application.ReadWrite.All
- Group.ReadWrite.All
- Files.ReadWrite.All
- Device.ReadWrite.All
- Calendars.ReadWrite
- Organization.ReadWrite.All
- People.Read.All
- Notes.ReadWrite.All
- Directory.ReadWrite.All

### install with curl

```bash
curl -o install.sh https://raw.githubusercontent.com/mklls/msgraph/master/install.sh && chmod +x install.sh && ./install.sh
```
