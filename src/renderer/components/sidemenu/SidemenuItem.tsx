import { useLocation, useNavigate } from 'react-router-dom';

const SidemenuItem = ({ label, icon, url }: { label: string; icon: React.ReactNode; url: string }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isSelected = pathname === url;

  return (
    <button
      onClick={() => navigate(url)}
      className={`w-full inline-flex items-center justify-start whitespace-nowrap rounded-lg text-sm px-4 py-2 duration-100 ${
        isSelected ? 'bg-card shadow font-semibold text-foreground' : 'hover:bg-card/30 active:bg-card/50 text-background/50 hover:text-background'
      }`}
    >
      <div className="max-w-4 mr-2">{icon}</div>
      {label}
    </button>
  );
};

export default SidemenuItem;
