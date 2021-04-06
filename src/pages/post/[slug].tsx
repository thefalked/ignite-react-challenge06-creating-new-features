import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { compareAsc, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import Link from 'next/link';

import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { UtterancesComments } from '../../components/UtterancesComments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  next_page: {
    uid: string;
    title: string;
  } | null;
  prev_page: {
    uid: string;
    title: string;
  } | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | Spacetraveling</title>
      </Head>

      <Header />

      <main className={styles.post}>
        <article>
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt="banner" />
          </div>

          <div className={commonStyles.container}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <div className={styles.time}>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </div>
              <div className={styles.author}>
                <FiUser />
                {post.data.author}
              </div>
              <div className={styles.readingTime}>
                <FiClock />
                {Math.ceil(
                  post.data.content.reduce((acc, content) => {
                    let contentLength = acc;
                    contentLength += content.heading.split(' ').length;
                    contentLength += RichText.asText(content.body).split(' ')
                      .length;

                    return contentLength;
                  }, 0) / 200
                )}{' '}
                min
              </div>
              {compareAsc(
                new Date(post.first_publication_date),
                new Date(post.last_publication_date)
              ) !== 0 && (
                <div className={styles.lastUpdate}>
                  * editado em{' '}
                  {format(
                    new Date(post.last_publication_date),
                    "dd MMM yyyy, 'às' HH:m",
                    {
                      locale: ptBR,
                    }
                  )}
                </div>
              )}
            </div>

            <div className={styles.content}>
              {post.data.content.map(content => (
                <div key={Math.random()}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              ))}
            </div>
            {(post.prev_page || post.next_page) && (
              <div className={styles.pagination}>
                {post.prev_page && (
                  <Link href={`/post/${post.prev_page.uid}`}>
                    <a className={styles.prevPage}>
                      {post.prev_page.title}
                      <span>Post anterior</span>
                    </a>
                  </Link>
                )}
                {post.next_page && (
                  <Link href={`/post/${post.next_page.uid}`}>
                    <a className={styles.nextPage}>
                      {post.next_page.title}
                      <span>Próximo post</span>
                    </a>
                  </Link>
                )}
              </div>
            )}
          </div>

          <UtterancesComments />

          {preview && (
            <div className={commonStyles.container}>
              <aside className={commonStyles.exitPreview}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            </div>
          )}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {}
  );

  return {
    paths: posts.results.map(post => ({
      params: {
        slug: post.uid,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
  params,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null,
  });

  const prevPost = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
      ref: previewData?.ref ?? null,
    }
  );

  const nextPost = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
      ref: previewData?.ref ?? null,
    }
  );

  const prev_page =
    (prevPost.results.length && {
      uid: prevPost.results[0].uid,
      title: prevPost.results[0].data.title,
    }) ||
    null;

  const next_page =
    (nextPost.results.length && {
      uid: nextPost.results[0].uid,
      title: nextPost.results[0].data.title,
    }) ||
    null;

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date || null,
    last_publication_date: response.last_publication_date || null,
    prev_page,
    next_page,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
    },
  };
};
