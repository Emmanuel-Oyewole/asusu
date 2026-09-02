export function StickyFormFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  );
}
