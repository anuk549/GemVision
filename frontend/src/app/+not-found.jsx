import React from 'react';
import { useRouter } from 'expo-router';
import { NotFound } from '../components';

export default function NotFoundRoute() {
  const router = useRouter();
  return (
    <NotFound
      actionText="Go home"
      onAction={() => router.replace('/')}
    />
  );
}
