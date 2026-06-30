import PokerGame from './PokerGame';

export default async function Page({ params }: { params: Promise<{ tableId: string }> }) {
    const { tableId } = await params;
    return <PokerGame tableId={tableId} />;
}
