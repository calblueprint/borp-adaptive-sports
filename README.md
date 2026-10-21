# BORP Adaptive Sports

### Overview

BORP Adaptive Sports and Recreation, based in Berkeley, CA, has for 50 years provided adaptive sports, fitness, and recreation programs for youth and adults with mobility and vision disabilities. Among its programs is Access California (Access CA), a roughly 20-year-old initiative that publishes detailed accessibility guides for outdoor sites — trails, beaches, parks, and gardens — across California, so that people with disabilities can know before they travel whether a site will work for them.

This app moves the whole field-collection process onto a phone:

1. Guided surveys. Any surveyor collects the same structured data, one question at a time, following their path through a site (parking → entrance → trail).
2. Offline-first. Everything works with no cell service and syncs when the device is back online.
3. Review and publish. Submitted surveys go to an admin review queue, and only approved records are published to the Access California site.

### Backend

The app uses a hosted Supabase project (Postgres, auth, and file storage).

#### How the app talks to Supabase

```javascript
api/supabase/client.ts
```
creates the single shared Supabase client. It reads the env vars above and saves the login session to device storage (AsyncStorage) so users stay signed in. Import it anywhere with:

```javascript
import supabase from '~/api/supabase/client';
```

### Schema

TODO

---
## Getting Started

### Prerequisites

Check your installation of `npm` and `node`:

```sh
node -v
npm -v
```

We strongly recommend using a Node version manager like [nvm](https://github.com/nvm-sh/nvm) (for Mac) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (for Windows) to install Node.js and npm. See [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Expo Go on your phone, or an iOS simulator / Android emulator

### Installation

1. Fork/copy the repo.
    1. Run:
    ```shell
    git clone https://github.com/calblueprint/borp-adaptive-sports.git
    ```
    2. Navigate to the correct directory:
    ```shell
    cd borp-adaptive-sports
    ```

2. Install project dependencies. This command installs all packages from [`package.json`](package.json).
      ```sh
      # installs the pnpm tool itself — only needed once per machine
      npm install -g pnpm
      # installs this project's dependencies via pnpm
      pnpm install
      ```
3. [in progress...] Set up secrets

### Development environment

- **[VSCode](https://code.visualstudio.com/) (recommended)**
  1. Open the project in VSCode.
  2. Install recommended workspace VSCode extensions. You should see a pop-up on the bottom right to "install the recommended extensions for this repository".

### Running the app

1. In the project directory, run:
   ```shell
    npx expo start
   ```
2. [Download Expo Go](https://docs.expo.dev/get-started/installation/#2-expo-go-app-for-android-and) on your phone, **connect to same network as your laptop**, and use your phone camera to scan the QR code displayed in the command line.

### Development tools

View the list of development scripts in the `package.json` file. Each script can be run through the terminal in the root of the project directory using the command below:

```sh
npm run <insert script name here>
```
