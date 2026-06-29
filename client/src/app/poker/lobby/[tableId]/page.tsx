import PokerLobbyWaiting from './PokerLobbyWaiting';

export default async function Page({ params }: { params: Promise<{ tableId: string }> }) {
    const { tableId } = await params;
    return <PokerLobbyWaiting tableId={tableId} />;
}
