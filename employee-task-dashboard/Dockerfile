# Use a slim version of the official Node 20 image (or 18, 16)
FROM node:20-slim 

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies (This is the critical step that was failing)
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (Render/Railway handles this, but good practice)
EXPOSE 3000 

# Define the command to start the application
CMD [ "npm", "start" ]
