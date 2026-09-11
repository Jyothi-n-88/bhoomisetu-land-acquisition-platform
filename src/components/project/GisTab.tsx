import React from 'react';
import GISMap from '../GISMap';

interface GisTabProps {
  projectId: string;
}

export default function GisTab({ projectId }: GisTabProps) {
  return <GISMap projectId={projectId} />;
}
