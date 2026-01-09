'use client';
import { useAtom } from 'jotai';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';
import { demoAtom } from '@/lib/jotai/atoms/demo.atom';
import { Button, Text } from '@mantine/core';

export default function HomePage() {
  const [count, setCount] = useAtom(demoAtom);
  return (
    <>
      <Welcome />
      <ColorSchemeToggle />
      <Button onClick={() => setCount(count + 1)} mx="xl">Increment</Button>
      <Text ta="center" size="lg" maw={580} mx="auto" mt="xl">Count: {count}</Text>
    </>
  );
}
