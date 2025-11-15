# Dockerfile (The Final Fix)

FROM node:20-alpine 

# CRITICAL FIX: Ensure Node binaries are in the shell's PATH
ENV PATH /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/bin/node/bin:$PATH

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first to use Docker's build cache
COPY package*.json ./

# Install dependencies 
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Define the command to start the application
CMD [ "npm", "start" ]
