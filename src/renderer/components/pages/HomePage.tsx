import Sidemenu from '../sidemenu/Sidemenu';
import { Outlet } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="w-screen h-screen flex p-3 gap-3">
      <Sidemenu />
      <Outlet />
    </div>
  );
};

export default HomePage;
