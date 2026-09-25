import fineseLogo from '@/assets/finese-logo.jpg';

export function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] px-4 sm:px-6 py-16">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-4">
        <img src={fineseLogo} alt="F" className="w-6 h-6 rounded-full object-cover" />
      </div>
    </div>
  );
}
