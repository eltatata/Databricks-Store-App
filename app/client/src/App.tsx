export default function App() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <section className="max-w-xl space-y-4 text-center">
        <h1 className="text-3xl font-semibold">Olist Store</h1>
        <p className="text-muted-foreground">
          The backend is live. The dashboard, product administration and assistant screens are being built.
        </p>
        <a className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground" href="/api/v1/docs/">
          Open the API documentation
        </a>
      </section>
    </main>
  );
}
