/* eslint-disable react/jsx-wrap-multilines */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Message, PageHeader } from '@arco-design/web-react';
import { useQuery } from '@demo/hooks/useQuery';
import { useHistory } from 'react-router-dom';
import { cloneDeep, set } from 'lodash';
import { Loading } from '@demo/components/loading';
import mjml from 'mjml-browser';
import { copy } from '@demo/utils/clipboard';
import services from '@demo/services';
import { IconMoonFill, IconSunFill } from '@arco-design/web-react/icon';
import { Liquid } from 'liquidjs';
import {
  EmailEditor,
  EmailEditorProvider,
  EmailEditorProviderProps,
  IEmailTemplate,
} from 'easy-email-editor';

import { FormApi } from 'final-form';

import { Stack } from '@demo/components/Stack';

import { useCollection } from './components/useCollection';
import { AdvancedType, BasicType, IBlockData, ITemplate, JsonToMjml } from 'easy-email-core';
import {
  BlockMarketManager,
  StandardLayout,
} from 'easy-email-extensions';
import { AutoSaveAndRestoreEmail } from '@demo/components/AutoSaveAndRestoreEmail';

import './components/CustomBlocks';

import 'easy-email-editor/lib/style.css';
import 'easy-email-extensions/lib/style.css';
import 'antd/dist/antd.css';
import appTheme from '@demo/styles/theme.css?inline';
import { testMergeTags } from './testMergeTags';
import { useMergeTagsModal } from './components/useMergeTagsModal';

import { useWindowSize } from 'react-use';
import { FONT_LIST, DEFAULT_CATEGORIES } from '@demo/constants';
const imageCompression = import('browser-image-compression');

export default function Editor() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [templateData, setTemplateData] = useState(services.template.fetchDefaultTemplate());
  const [templateOriginalData, setTemplateOriginalData] = useState<ITemplate>();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const history = useHistory();
  const { collectionCategory } = useCollection();

  const { width } = useWindowSize();

  const smallScene = width < 1200;

  const { template_id, token } = useQuery();
  const {
    mergeTags,
    setMergeTags,
  } = useMergeTagsModal(testMergeTags);

  useEffect(() => {
    if (collectionCategory) {
      BlockMarketManager.addCategories([collectionCategory]);
      return () => {
        BlockMarketManager.removeCategories([collectionCategory]);
      };
    }
  }, [collectionCategory]);


  useEffect(() => {
    if(template_id) {
      setLoading(true);
      services.template.getTemplate(template_id, token).then((res: any) => {
        if(res.templateName) {
          setLoading(false);
          setTemplateOriginalData({...res});
          if(res.helperJson) {
            if(typeof res.helperJson === 'string') {
              const obj = JSON.parse(res.helperJson);
              const footer = JSON.parse(res.footerJson);
              if(footer) {
                const json = JSON.parse(footer.helperJson);
                if(json && json.children && json.children.length > 0) {
                  obj.children.push(json.children[0]);
                }
              }
              if(Object.keys(obj).length > 0) {
                setTemplateData({
                  ...templateData,
                  content: typeof res.helperJson === 'string' ? obj : res.helperJson,
                })
              }
            } 
            
          }
        } 
      }).catch(() => {
        setLoading(false);
      })
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.setAttribute('arco-theme', 'dark');
    } else {
      document.body.removeAttribute('arco-theme');
    }
  }, [isDarkMode]);

  const onUploadImage = async (blob: Blob) => {
    const compressionFile = await (
      await imageCompression
    ).default(blob as File, {
      maxWidthOrHeight: 1440,
    });
    return services.common.uploadByQiniu(compressionFile);
  };

  const onChangeMergeTag = useCallback((path: string, val: any) => {
    setMergeTags(old => {
      const newObj = cloneDeep(old);
      set(newObj, path, val);
      return newObj;
    });
  }, []);

  const onExportHtml = (values: IEmailTemplate) => {
    const html = mjml(
      JsonToMjml({
        data: values.content,
        mode: 'production',
        context: values.content,
        dataSource: mergeTags,
      }),
      {
        beautify: true,
        validationLevel: 'soft',
      },
    ).html;

    copy(html);
    Message.success('Copied to pasteboard!');
  };

  const initialValues: IEmailTemplate | null = useMemo(() => {
    if (!templateData) return null;
    const sourceData = cloneDeep(templateData.content) as IBlockData;
    return {
      ...templateData,
      content: sourceData,
    };
  }, [templateData]);

  const onSubmit = useCallback(
    async (
      values: IEmailTemplate,
      form: FormApi<IEmailTemplate, Partial<IEmailTemplate>>,
    ) => {
      const html = mjml(
        JsonToMjml({
          data: values.content,
          mode: 'production',
          context: values.content,
          dataSource: mergeTags,
        }),
        {
          beautify: true,
          validationLevel: 'soft',
        },
      ).html;
      setIsSubmitting(true);
      services.template.updateArticle(
          template_id, 
          templateOriginalData?.subject, 
          html, 
          templateOriginalData?.text, 
          templateOriginalData?.id, 
          values.content).then((res: any) => {
            setIsSubmitting(false)
            if(res && res.status && res.status === '200') {
              form.restart(values)
              Message.success('Template saved!');
            }
      }).catch(() => {
        setIsSubmitting(false)
      }) 
    },
    [history, template_id, initialValues],
  );

  const onBeforePreview: EmailEditorProviderProps['onBeforePreview'] = useCallback(
    (html: string, mergeTags) => {
      const engine = new Liquid();
      const tpl = engine.parse(html);
      return engine.renderSync(tpl, mergeTags);
    },
    [],
  );


  if (loading) {
    return (
      <Loading loading={loading}>
        <div style={{ height: '100vh' }} />
      </Loading>
    );
  }

  if (!initialValues) return null;
  
  return (
    <div>
      <style>{appTheme}</style>
      <EmailEditorProvider
        key={template_id}
        height={'calc(100vh - 68px)'}
        data={initialValues}
        onUploadImage={onUploadImage}
        fontList={FONT_LIST}
        onSubmit={onSubmit}
        onChangeMergeTag={onChangeMergeTag}
        autoComplete
        enabledLogic
        dashed={false}
        mergeTagGenerate={tag => `{{${tag}}}`}
        onBeforePreview={onBeforePreview}
        socialIcons={[]}
      >
        {({ values }, { submit }) => {
          return (
            <>
              <PageHeader
                style={{ background: 'var(--color-bg-2)' }}
                extra={
                  <Stack alignment='center'>
                    <Button
                      onClick={() => setIsDarkMode(v => !v)}
                      shape='circle'
                      type='text'
                      icon={isDarkMode ? <IconMoonFill /> : <IconSunFill />}
                    ></Button>

                    <Button onClick={() => onExportHtml(values)}>Export html</Button>
                    <Button
                      loading={isSubmitting}
                      type='primary'
                      onClick={() => submit()}
                    >
                      Save
                    </Button>
                  </Stack>
                }
              />
              <StandardLayout
                compact={!smallScene}
                categories={DEFAULT_CATEGORIES}
              >
                <EmailEditor />
              </StandardLayout>
              <AutoSaveAndRestoreEmail />
            </>
          );
        }}
      </EmailEditorProvider>
      <style>{`#bmc-wbtn {display:none !important;}`}</style>
    </div>
  );
}

function replaceStandardBlockToAdvancedBlock(blockData: IBlockData) {
  const map = {
    [BasicType.TEXT]: AdvancedType.TEXT,
    [BasicType.BUTTON]: AdvancedType.BUTTON,
    [BasicType.IMAGE]: AdvancedType.IMAGE,
    [BasicType.DIVIDER]: AdvancedType.DIVIDER,
    [BasicType.SPACER]: AdvancedType.SPACER,
    [BasicType.SOCIAL]: AdvancedType.SOCIAL,
    [BasicType.ACCORDION]: AdvancedType.ACCORDION,
    [BasicType.CAROUSEL]: AdvancedType.CAROUSEL,
    [BasicType.NAVBAR]: AdvancedType.NAVBAR,
    [BasicType.WRAPPER]: AdvancedType.WRAPPER,
    [BasicType.SECTION]: AdvancedType.SECTION,
    [BasicType.GROUP]: AdvancedType.GROUP,
    [BasicType.COLUMN]: AdvancedType.COLUMN,
  };

  if (map[blockData.type]) {
    blockData.type = map[blockData.type];
  }
  blockData.children.forEach(replaceStandardBlockToAdvancedBlock);
  return blockData;
}
