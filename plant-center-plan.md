# Plant Center Implementation Plan

## Overview
This document outlines the implementation plan for the new **Plant Center** page (formerly known as the Admin page). This page will give users full CRUD (Create, Read, Update, Delete) capabilities over their Plants and associated Devices, including device-specific sensor configurations.

## 1. Database Schema Updates
We need to update the `devices` table to support multiple sensor types in the future.
- **Create a Migration**: Create a new Supabase migration file.
- **Add `type` column**: Add a `type` column (text or enum) to the `devices` table.
- **Default value**: Set the default value to `'humidity'` for existing devices.

## 2. Page Layout & Structure
The Plant Center will use a vertical tab layout to switch between management sections smoothly.
- **Route**: Update the frontend routing (if applicable) to load the `PlantCenter` component.
- **Mantine Tabs**: Use Mantine's `<Tabs orientation="vertical">` to create a sidebar navigation feel.
- **Tabs**:
  - **Plants**: For managing plant entities.
  - **Devices**: For managing devices and their sensor configurations.

## 3. Plants Management (Tab 1)
CRUD operations for the `plants` table.
- **Data Table/Grid**: Display a list of all existing plants (`id`, `name`, `status`, `image_url`).
- **Actions**: Add an "Add Plant" button and edit/delete icons for each row.
- **Form**: Create a Modal or Drawer containing a form for:
  - `name` (text)
  - `image_url` (text/url, or future file upload)
- **Delete Constraints**: Ensure safe deletion (handling or notifying about cascading deletes of attached devices/measurements).

## 4. Devices & Sensor Management (Tab 2)
Combined CRUD operations for `devices` and `humidity_sensors_config` tables.
- **Data Table/Grid**: Display all existing devices (`serialNumber`, `plantId`, `type`).
- **Dynamic Form**: Create a Modal/Drawer for adding and editing devices.
  - **Base Fields**:
    - `serialNumber` (text)
    - `plantId` (select/dropdown populated from existing plants)
    - `type` (select/dropdown - currently only options is "Humidity")
  - **Conditional Fields (if Type == "Humidity")**:
    - `airValue` (number)
    - `waterValue` (number)
    - `minHumidityThreshold` (number, percentage)
    - `sleep_duration_seconds` (number)
- **Data Mutation**:
  - **Creating**: Perform a two-step insertion or a Supabase RPC call. First, insert the device into the `devices` table. Once the `device.id` is returned, insert the configuration into `humidity_sensors_config`.
  - **Updating**: Update the `devices` table and the `humidity_sensors_config` table accordingly.
  - **Deleting**: Remove the device (ensure `ON DELETE CASCADE` is set up properly for the config table so it cleans up automatically).

## 5. UI/UX Details
- **Feedback**: Utilize Mantine `<Notifications />` to show success or error states upon form submission or deletion.
- **Validation**: Ensure numeric bounds (e.g., minimum thresholds between 0-100, positive integers for intervals).
- **Confirmations**: Display confirmation dialogs before completing deletion actions to prevent accidental data loss.
