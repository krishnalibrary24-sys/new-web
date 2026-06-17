"use client";
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/invoice?id=${id}`);
    } else {
      router.replace('/dashboard/invoices');
    }
  }, [id, router]);

  return <div className="p-10 text-center text-slate-400">Redirecting to Invoice Pipeline...</div>;
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading Redirect...</div>}>
      <RedirectContent />
    </Suspense>
  );
}
