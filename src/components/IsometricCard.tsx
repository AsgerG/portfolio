export function IsometricCard() {
  return (
    <div
      className="w-60 h-60 rounded-[46px] border border-white/[0.06]"
      style={{
        background: 'linear-gradient(135deg, #32353d 0%, #24262c 100%)',
        boxShadow:
          '0 30px 25px -22px rgba(0,0,0,0.55), 0 70px 60px -35px rgba(0,0,0,0.6)',
        transform: 'scaleY(0.577) rotate(45deg)',
      }}
    />
  );
}
