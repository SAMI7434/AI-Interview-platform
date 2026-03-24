# Use an official Node.js runtime as the base image
FROM public.ecr.aws/docker/library/node:lts-jod AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN npm run build

# ---- Production Stage ----
FROM public.ecr.aws/docker/library/node:lts-jod AS production

# Set the working directory inside the container
WORKDIR /app

# Copy only necessary files from the previous stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm install --omit=dev

# Expose the application port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Command to run the application
CMD ["node", "dist/src/server.js"]
