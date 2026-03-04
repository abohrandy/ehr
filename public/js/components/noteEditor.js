/**
 * NoteEditor — Structured session note editor component.
 */
const NoteEditor = (() => {
    const TEMPLATES = {
        soap: {
            label: 'SOAP Note',
            sections: [
                { key: 'subjective', label: 'Subjective', letter: 'S', placeholder: 'Client\'s self-report, feelings, symptoms...' },
                { key: 'objective', label: 'Objective', letter: 'O', placeholder: 'Therapist\'s observations, behaviors, appearance...' },
                { key: 'assessment_section', label: 'Assessment', letter: 'A', placeholder: 'Clinical interpretation, diagnosis progress...' },
                { key: 'plan_section', label: 'Plan', letter: 'P', placeholder: 'Treatment direction, homework, next session focus...' },
            ],
        },
        dap: {
            label: 'DAP Note',
            sections: [
                { key: 'data_section', label: 'Data', letter: 'D', placeholder: 'Client statements, observed behaviors, session content...' },
                { key: 'assessment_section', label: 'Assessment', letter: 'A', placeholder: 'Clinical interpretation and analysis...' },
                { key: 'plan_section', label: 'Plan', letter: 'P', placeholder: 'Planned interventions, goals for next session...' },
            ],
        },
        progress: {
            label: 'Progress Note',
            sections: [
                { key: 'subjective', label: 'Subjective', letter: 'S', placeholder: 'Client\'s self-report...' },
                { key: 'intervention', label: 'Intervention', letter: 'I', placeholder: 'Techniques and methods used...' },
                { key: 'objective', label: 'Objective', letter: 'O', placeholder: 'Measurable observations...' },
                { key: 'plan_section', label: 'Plan', letter: 'P', placeholder: 'Next steps and follow-up...' },
            ],
        },
    };

    function render(noteType = 'soap', data = {}, locked = false) {
        const template = TEMPLATES[noteType];
        if (!template) return '<p>Unknown note type</p>';

        const sections = template.sections.map((s) => `
      <div class="note-section">
        <label><span class="letter">${s.letter}</span> ${s.label}</label>
        <textarea class="form-control" name="${s.key}" placeholder="${s.placeholder}" ${locked ? 'disabled' : ''}>${data[s.key] || ''}</textarea>
      </div>
    `).join('');

        return `
      ${locked ? '<div class="note-locked"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> This note is locked and cannot be edited</div>' : ''}
      <div class="note-fields">${sections}</div>
    `;
    }

    function getData(container) {
        const data = {};
        container.querySelectorAll('textarea[name]').forEach((el) => {
            data[el.name] = el.value;
        });
        return data;
    }

    return { TEMPLATES, render, getData };
})();
