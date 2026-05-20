import React from 'react';
import CrudPage from '../components/CrudPage';
import { selector_libraryApi } from '../services/api';

const FIELDS = [
  { key: 'app_name', label: 'App', type: 'text' },
  { key: 'semantic_label', label: 'Semantic Label', type: 'text' },
  { key: 'css_selector', label: 'CSS Selector', type: 'text' },
  { key: 'success_count', label: 'Success Count', type: 'number' }
];

export default function SelectorLibraryPage() {
  return (
    <CrudPage
      title="Selector Library"
      subtitle="Manage selector library records"
      api={selector_libraryApi}
      fields={FIELDS}
      statusKey="status"
    />
  );
}
