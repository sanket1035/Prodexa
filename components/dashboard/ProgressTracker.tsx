"use client";

import React from "react";
import AuditPipelineViewer, { AuditPipelineViewerProps } from "./AuditPipelineViewer";

interface ProgressTrackerProps {
  currentModule?: string | null;
  status?: string;
  isExecuting?: boolean;
  completedRun?: any;
  websiteUrl?: string | null;
  githubRepoUrl?: string | null;
  onFinish?: () => void;
}

export default function ProgressTracker(props: ProgressTrackerProps) {
  const isRunning = props.isExecuting || props.status === "running" || props.status === "executing";
  return (
    <AuditPipelineViewer
      isExecuting={isRunning}
      completedRun={props.completedRun || null}
      websiteUrl={props.websiteUrl}
      githubRepoUrl={props.githubRepoUrl}
      onFinish={props.onFinish}
    />
  );
}

export { AuditPipelineViewer };
