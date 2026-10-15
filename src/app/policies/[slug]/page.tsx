import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ReactMarkdown from "react-markdown"

import { Container } from "@/components/site/public-shell"
import { getPublishedShopPolicy } from "@/lib/server-api"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const policy = await getPublishedShopPolicy(slug)
  return policy ? { title: policy.title } : {}
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params
  const policy = await getPublishedShopPolicy(slug)
  if (!policy) notFound()

  return (
    <Container className="max-w-4xl py-10 sm:py-14">
      <article>
        <p className="text-sm font-medium text-primary">Thông tin cửa hàng</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{policy.title}</h1>
        <div className="mt-8 space-y-4 text-sm leading-7 text-foreground/85 [&_h1]:mt-7 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_p]:whitespace-pre-wrap [&_ul]:list-disc">
          <ReactMarkdown>{policy.content}</ReactMarkdown>
        </div>
      </article>
    </Container>
  )
}
