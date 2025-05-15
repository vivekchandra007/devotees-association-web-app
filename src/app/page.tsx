"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from "next/navigation";
import FullPageSpinner from '@/components/FullPageSpinner';
import TopNavBar from '@/components/TopNavBar';
import { Button } from 'primereact/button';
import ProfileCompletionMeter from '@/components/ProfileCompletionMeter';
import { Card } from 'primereact/card';
import Image from "next/image";
import { Divider } from 'primereact/divider';

export default function Home() {
  const router = useRouter();
  const { devotee, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <FullPageSpinner message="Hare Krishna! Fetching your details..." />;

  const title = (
    <p>
      Hare Krishna! {devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_levels[`title_${devotee?.gender}`]}` : ''} 🙏🏻
    </p>
  );

  const header = (
    <div className="max-h-[240px] max-w-[240px] m-auto">
      <Image
        className="rounded-full mt-4 border-2 border-yellow-500"
        src="/app-image.jpg"
        alt="Devotees' Association"
        width={240}
        height={240}
        priority
      />
    </div>
  );

  const footer = (
    <div className="max-h-[214px] max-w-[600px] m-auto">
      {/* <small className="text-orange-600 text-shadow">
        || हरे कृष्णा, हरे कृष्णा, कृष्णा कृष्णा, हरे हरे ||
        || हरे राम, हरे राम, राम राम, हरे हरे ||
      </small> */}
      <Image
        src="/chant-and-be-happy.png"
        alt="Devotees' Association"
        width={600}
        height={214}
        priority
      />
    </div>
  );

  return (
    <>
      <TopNavBar />
      <div className="grid md:pt-4 justify-items-center min-h-screen">
        <Card title={title}
          subTitle="Congratulations! for getting temple in our area" footer={footer} header={header}
          className="shadow-2xl w-93 md:w-110 text-center component-transparent">
          <div>
            Our new <br /><span className="pi pi-star-fill text-yellow-500" />&nbsp;&nbsp;<strong>Shri Shri Radha Krishna Temple</strong>&nbsp;&nbsp;<span className="pi pi-star-fill text-yellow-500" /><br />in Baner, Pune has started taking shape.
            <br /><br />
            <Button id="btn-sign-in" label="Step 1: Contribute towards building New Temple" severity="warning" raised size="small"
              icon="pi pi-indian-rupee"
              onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")} />
            <Divider align="center">
            </Divider>
            <Button id="btn-sign-in" label="Step 2: Come, join our Whatsapp group" severity="success" raised size="small"
              icon="pi pi-whatsapp"
              onClick={() => alert('Link to a Whatsapp group')} />

            <Divider align="center">
            </Divider>
            <Button id="btn-sign-in" label="Step 3: Keep your profile upto date" severity="info" raised className="w-full" size="small"
              icon="pi pi-mobile"
              onClick={() => router.push('/devotee')}>
              <ProfileCompletionMeter devotee={devotee} className="pl-7" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}