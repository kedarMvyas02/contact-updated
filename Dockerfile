# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory to /app
WORKDIR /

# Copy the current directory contents into the container at /app
COPY . /

# Install any needed packages specified in package.json
RUN npm install

# Make port 3000 available to the world outside this container
EXPOSE 8000

# Run the app when the container launches
CMD ["npm", "start"]