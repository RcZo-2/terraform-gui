# Terraform Visualizer

A Next.js web application for visualizing Terraform plan JSON files.

## Features

- **Upload Plan Files:** Upload standard Terraform plan JSON files to parse created, updated, and deleted resources.
- **Interactive Diagram:** See your infrastructure graphically. Resources and their relationships are visualized as an interactive node diagram built with [React Flow](https://reactflow.dev/).
- **Resource Details:** Click on any node in the diagram to view its details.
- **Resizable Side Pane:** The details pane appears on the left and can be dynamically resized using a drag handle.
- **Quick Commands & JSON:** The details view provides copy-pasteable `terraform apply` and `destroy` target commands, an extracted overview of essential resource fields (Type, Name, Provider, Action, ARN), and a complete viewer for the raw JSON details.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) (App Router)
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Visualization:** `reactflow`
- **Icons:** `lucide-react`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Example Usage

1. Run `terraform plan -out=plan.tfplan` in your Terraform directory.
2. Run `terraform show -json plan.tfplan > plan.json`.
3. Open the Terraform Visualizer app and upload `plan.json`.
4. Explore your resources visually!

## Project Structure

- `src/app/`: Next.js App Router entry point.
  - `page.tsx`: The main visualizer page that hosts the diagram and state.
- `src/components/`: Reusable React components.
  - `CustomNode.tsx`: The visual representation of a single Terraform resource in the diagram.
  - `Diagram.tsx`: The React Flow canvas implementation.
  - `FileUpload.tsx`: Handlers and UI for uploading the `.json` plan file.
  - `ResourceDetails.tsx`: The resizable sidebar pane that shows resource JSON and commands.
- `src/lib/`: Utility libraries.
  - `parsePlan.ts`: Core logic for decoding the Terraform plan JSON and converting it into nodes and edges for React Flow.

