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

  const header = (
    <div className="max-h-[60px] max-w-[60px] m-auto hidden md:block">
      <Image
        className="rounded-full mt-2 border-2 border-yellow-500"
        src="/app-image.jpg"
        alt="Devotees' Association"
        width={60}
        height={60}
        priority
      />
    </div>
  );

  const title = (
    <small>
      Hare Krishna! <br />{devotee?.name}{devotee?.gender ? `, ${devotee.spiritual_levels[`title_${devotee?.gender}`]}` : ''} 🙏🏻
    </small>
  );

  const subTitle = (
    <small className="text-xs md:text-base">
      Congratulations! <br />
      you are getting your own temple in Baner
    </small>
  );

  const footer = (
    <div className="max-h-[214px] max-w-[600px] m-auto">
      {/* <small className="text-orange-600 text-shadow">
        || हरे कृष्णा, हरे कृष्णा, कृष्णा कृष्णा, हरे हरे ||
        || हरे राम, हरे राम, राम राम, हरे हरे ||
      </small> */}
      <Image
        src="/signature-prabhupada.png"
        alt="Devotees' Association"
        width={600}
        height={214}
        priority
      />
    </div>
  );

  return (
    <>
      <Image
        className="absolute -z-1 top-0 left-0 w-full h-full object-cover"
        src="/app-image.jpg"
        alt="Devotees' Association background image"
        sizes="100v"
        fill
        priority
      />
      <TopNavBar />
      <div className="grid md:pt-1 justify-items-center min-h-screen">
        <Card title={title}
          subTitle={subTitle} footer={footer} header={header}
          className="shadow-2xl w-93 md:w-110 text-center component-transparent">
          <div>
            <div>
              <strong className="font-bonheur md:text-2xl">Shri Shri <span className="text-5xl text-[#e07338]">Radha Krishna</span>&nbsp;Temple</strong>
            </div>
            <Image
              className="m-auto"
              src="/chant-and-be-happy.png"
              alt="Devotees' Association"
              width={200}
              height={214}
              priority
            />
            <br />
            <small className="block">So, now it&apos;s your turn. Take following steps:</small><br />
            <Button id="btn-sign-in" label="Step 1: Don't miss this Opportunity. Contribute towards building it." severity="warning" raised size="small"
              icon="pi pi-indian-rupee"
              onClick={() => window.open("https://iskconpunebcec.com/#/newtemple")} />
            <br /><br />
            <Button id="btn-sign-in" label="Step 2: Come, join our Whatsapp group for latest updates and spiritual association" severity="success" raised size="small"
              icon="pi pi-whatsapp"
              onClick={() => alert('Link to a Whatsapp group')} />
            <br /><br />
            <Button id="btn-sign-in" label="Step 3: Keep your profile upto date" severity="info" raised className="w-full" size="small"
              icon="pi pi-mobile"
              onClick={() => router.push('/devotee')}>
              <ProfileCompletionMeter devotee={devotee} className="pl-7" />
            </Button>
            <br /><br />
            <Button id="btn-sign-in" label="Step 4: Let&apos;s Spread the word. Refer Others and become a spiritual catalyst in their life." severity="secondary" raised size="small"
              icon="pi pi-fw pi-share-alt"
              onClick={() => router.push('/referral')} />
          </div>
          <Divider align="center">
          </Divider>
        </Card>
      </div>
    </>
  );
}