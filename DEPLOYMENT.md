# Deployment Guide for Render.com

This guide will help you deploy the ETHI backend application to Render.com with environment variables.

## Prerequisites

1. A Render.com account
2. All the required API keys and secrets (see Environment Variables section)

## Environment Variables

Before deploying, you need to set up the following environment variables in your Render.com service:

### Database Configuration
- `MONGODB_URI`: Your MongoDB connection string

### SendGrid Email Configuration
- `SENDGRID_API_KEY`: Your SendGrid API key
- `SENDGRID_FROM_EMAIL`: Your SendGrid verified sender email

### Stripe Payment Configuration
- `STRIPE_SECRET_KEY`: Your Stripe test secret key
- `STRIPE_LIVE_SECRET_KEY`: Your Stripe live secret key

### WATI WhatsApp API Configuration
- `WATI_API_KEY`: Your WATI API key
- `WATI_API_URL`: Your WATI API endpoint URL

### Agora Video Call Configuration
- `AGORA_APP_ID`: Your Agora App ID
- `AGORA_APP_CERTIFICATE`: Your Agora App Certificate
- `AGORA_CHANNEL_NAME`: Your Agora channel name

### Firebase Push Notification Configuration
- `FIREBASE_SERVER_KEY`: Your Firebase server key
- `FCM_URL`: Firebase Cloud Messaging URL

### Website URLs
- `WEBSITE_LINK`: Your main website URL
- `API_WEBSITE_LINK`: Your API website URL

### CORS Configuration
- `CORS_ORIGIN`: Allowed CORS origin (e.g., your frontend URL)

### Server Configuration
- `PORT`: Server port (default: 8080)

## Deployment Steps

1. **Fork or clone this repository** to your GitHub account

2. **Create a new Web Service on Render.com:**
   - Go to your Render dashboard
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose the repository containing this code

3. **Configure the service:**
   - **Name**: Give your service a name (e.g., "ethi-backend")
   - **Environment**: Node
   - **Node Version**: 22 (or use the .nvmrc file)
   - **Build Command**: `npm install --omit=dev`
   - **Start Command**: `npm start`
   - **Plan**: Choose your preferred plan

4. **Set Environment Variables:**
   - In the Render dashboard, go to your service settings
   - Navigate to the "Environment" tab
   - Add all the environment variables listed above with their actual values
   - Make sure to use your production values (not the example values from .env.example)

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - Monitor the build logs for any issues

## Important Notes

- **Never commit the `.env` file** to version control (it's already in `.gitignore`)
- **Use production API keys** for your live deployment
- **Test your environment variables** before deploying to production
- **Monitor your application logs** in the Render dashboard for any runtime issues

## Local Development

For local development:

1. Copy `.env.example` to `.env`
2. Fill in your actual values in the `.env` file
3. Run `npm install` to install dependencies
4. Run `npm start` to start the development server

## Troubleshooting

### Common Build Issues

**npm install hanging/timeout:**
- Use `npm ci --only=production` instead of `npm install`
- Ensure Node.js version 22 is specified
- Check that all dependencies are compatible

**Puppeteer installation issues:**
- The app now uses optimized puppeteer configuration for Render.com
- If puppeteer still fails, consider using a different PDF generation library

**Memory issues during build:**
- Render.com free tier has limited memory
- Consider upgrading to a paid plan if build consistently fails
- Use `npm ci --only=production` to reduce memory usage

### General Troubleshooting

- **Build failures**: Check the build logs in Render dashboard
- **Runtime errors**: Check the service logs in Render dashboard
- **Environment variable issues**: Verify all required variables are set in Render dashboard
- **Database connection issues**: Verify your MongoDB URI is correct and accessible

## Security Best Practices

- Use different API keys for development and production
- Regularly rotate your API keys
- Monitor your API usage and costs
- Keep your environment variables secure and never expose them in logs
