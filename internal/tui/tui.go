package tui

import (
	tea "github.com/charmbracelet/bubbletea"
)

type TUIConfig struct {
	TunnelURL  string
	LocalPort  int
	InspectURL string
}

func Run(config TUIConfig, program **tea.Program) error {
	model := NewModel(config.TunnelURL, config.LocalPort, config.InspectURL)
	p := tea.NewProgram(model, tea.WithAltScreen())
	*program = p
	_, err := p.Run()
	return err
}

func Send(program *tea.Program, event EventMsg) {
	if program != nil {
		program.Send(event)
	}
}
