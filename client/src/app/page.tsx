import { redirect } from 'next/navigation';
import Login from '@/components/Login';

export default function Home() {
    if (process.env.NEXT_PUBLIC_CLIENT_DEV === 'true') redirect('/lobby');
    return <Login />;
}
