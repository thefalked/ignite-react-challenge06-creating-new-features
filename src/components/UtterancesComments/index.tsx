import { useEffect, useRef } from 'react';

export const UtterancesComments: React.FC = () => {
  const container = useRef();

  useEffect(() => {
    if (!container.current) return;

    const config = {
      src: 'https://utteranc.es/client.js',
      repo: 'donaldboulton/publiuslogic',
      label: 'comments',
      'issue-term': 'pathname',
      theme: 'github-dark',
      async: true,
      crossorigin: 'anonymous',
    };

    const script = document.createElement('script');

    Object.keys(config).forEach(key => {
      script.setAttribute(key, config[key]);
    });

    // Append the Utterances script to the container
    while (container.current.firstChild) container.current.firstChild.remove();
    container.current.appendChild(script);
  }, []);

  return <div ref={container} />;
};
