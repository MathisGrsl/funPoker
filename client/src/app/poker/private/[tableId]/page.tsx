import PrivatePokerLobby from './PrivatePokerLobby';

export default async function Page({ params }: { params: Promise<{ tableId: string }> }) {
    const { tableId } = await params;
    return <PrivatePokerLobby tableId={tableId} />;
}
