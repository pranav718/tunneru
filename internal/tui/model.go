package tui

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type Model struct {
	TunnelURL   string
	LocalPort   int
	InspectURL  string
	Status      string
	Requests    []RequestEvent
	MaxRequests int
	TotalReqs   int
	OkCount     int
	ErrorCount  int
	TotalLatMs  int64
	Width       int
	Height      int
	ScrollOff   int
}

func NewModel(tunnelURL string, localPort int, inspectURL string) Model {
	return Model{
		TunnelURL:   tunnelURL,
		LocalPort:   localPort,
		InspectURL:  inspectURL,
		Status:      "connecting",
		Requests:    make([]RequestEvent, 0, 100),
		MaxRequests: 100,
		Width:       80,
		Height:      24,
	}
}

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height

	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		case "c":
			m.Requests = m.Requests[:0]
			m.TotalReqs = 0
			m.OkCount = 0
			m.ErrorCount = 0
			m.TotalLatMs = 0
			m.ScrollOff = 0
		case "up", "k":
			if m.ScrollOff > 0 {
				m.ScrollOff--
			}
		case "down", "j":
			maxScroll := len(m.Requests) - m.visibleRows()
			if maxScroll < 0 {
				maxScroll = 0
			}
			if m.ScrollOff < maxScroll {
				m.ScrollOff++
			}
		}

	case EventMsg:
		switch msg.Type {
		case "request":
			if msg.Request != nil {
				m.Requests = append(m.Requests, *msg.Request)
				if len(m.Requests) > m.MaxRequests {
					m.Requests = m.Requests[len(m.Requests)-m.MaxRequests:]
				}
				m.TotalReqs++
				m.TotalLatMs += int64(msg.Request.LatencyMs)
				if msg.Request.StatusCode >= 200 && msg.Request.StatusCode < 400 {
					m.OkCount++
				} else {
					m.ErrorCount++
				}
				maxScroll := len(m.Requests) - m.visibleRows()
				if maxScroll < 0 {
					maxScroll = 0
				}
				m.ScrollOff = maxScroll
			}
		case "status":
			if msg.Status != nil {
				m.Status = msg.Status.Status
			}
		}
	}

	return m, nil
}

func (m Model) visibleRows() int {
	available := m.Height - 14
	if available < 3 {
		return 3
	}
	return available
}

func (m Model) View() string {
	var sections []string

	sections = append(sections, m.renderHeader())
	sections = append(sections, m.renderInfoCard())
	sections = append(sections, m.renderDivider())
	sections = append(sections, m.renderTableHeader())
	sections = append(sections, m.renderDivider())
	sections = append(sections, m.renderRequestRows())
	sections = append(sections, m.renderDivider())
	sections = append(sections, m.renderStatusBar())

	return lipgloss.JoinVertical(lipgloss.Left, sections...)
}

func (m Model) renderHeader() string {
	brand := BrandStyle.Render("tunneru")
	version := VersionStyle.Render("v0.1.0")

	statusDot := "●"
	pill := StatusPillStyle(m.Status).Render(statusDot + " " + m.Status)

	left := brand
	right := version + "  " + pill

	gap := m.Width - lipgloss.Width(left) - lipgloss.Width(right) - 6
	if gap < 1 {
		gap = 1
	}

	content := left + strings.Repeat(" ", gap) + right
	return HeaderStyle.Width(m.Width - 2).Render(content)
}

func (m Model) renderInfoCard() string {
	if m.Height < 20 {
		line := InfoLabelStyle.Render("tunnel") +
			InfoValueStyle.Render(m.TunnelURL) +
			"  " +
			InfoLabelStyle.Render("local") +
			InfoValueStyle.Render(fmt.Sprintf("http://localhost:%d", m.LocalPort))
		return InfoCardStyle.Width(m.Width - 2).Render(line)
	}

	lines := []string{
		InfoLabelStyle.Render("tunnel") + InfoValueStyle.Render(m.TunnelURL),
		InfoLabelStyle.Render("forwarding") + InfoValueStyle.Render(fmt.Sprintf("http://localhost:%d", m.LocalPort)),
		InfoLabelStyle.Render("inspect") + InfoValueStyle.Render(m.InspectURL),
	}
	return InfoCardStyle.Width(m.Width - 2).Render(strings.Join(lines, "\n"))
}

func (m Model) renderDivider() string {
	line := strings.Repeat("─", m.Width-4)
	return DividerStyle.Render(line)
}

func (m Model) renderTableHeader() string {
	pathWidth := 36
	if m.Width < 80 {
		pathWidth = 24
	}

	cols := []string{
		TimeStyle.Render("TIME"),
	}
	if m.Width >= 60 {
		cols = append(cols, lipgloss.NewStyle().Width(8).Foreground(lipgloss.Color(ColorTextSecondary)).Render("METHOD"))
	}
	cols = append(cols, lipgloss.NewStyle().Width(pathWidth).Foreground(lipgloss.Color(ColorTextSecondary)).Render("PATH"))
	cols = append(cols, lipgloss.NewStyle().Width(16).Foreground(lipgloss.Color(ColorTextSecondary)).Render("STATUS"))
	if m.Width >= 80 {
		cols = append(cols, lipgloss.NewStyle().Foreground(lipgloss.Color(ColorTextSecondary)).Render("LATENCY"))
	}

	row := strings.Join(cols, "  ")
	return TableHeaderStyle.Width(m.Width - 2).Render(row)
}

func (m Model) renderRequestRows() string {
	if len(m.Requests) == 0 {
		empty := lipgloss.NewStyle().
			Foreground(lipgloss.Color(ColorTextSecondary)).
			Width(m.Width - 4).
			Align(lipgloss.Center).
			Padding(2, 0)

		line1 := "waiting for requests..."
		line2 := "tunneru is ready at " + m.TunnelURL
		return empty.Render(line1 + "\n" + line2)
	}

	visible := m.visibleRows()
	start := m.ScrollOff
	end := start + visible
	if end > len(m.Requests) {
		end = len(m.Requests)
	}
	if start > len(m.Requests) {
		start = len(m.Requests)
	}

	var rows []string
	for i := start; i < end; i++ {
		req := m.Requests[i]
		alternate := (i-start)%2 == 1

		pathWidth := 36
		if m.Width < 80 {
			pathWidth = 24
		}

		timeStr := req.Timestamp.Format("15:04:05")
		path := req.Path
		if len(path) > pathWidth-3 {
			path = path[:pathWidth-3] + "..."
		}

		statusText := fmt.Sprintf("%d %s", req.StatusCode, req.StatusText)
		if len(statusText) > 14 {
			statusText = statusText[:14]
		}

		cols := []string{
			TimeStyle.Render(timeStr),
		}
		if m.Width >= 60 {
			cols = append(cols, MethodBadgeStyle(req.Method).Render(strings.ToLower(req.Method)))
		}
		cols = append(cols, PathStyle.Width(pathWidth).Render(path))
		cols = append(cols, StatusBadgeStyle(req.StatusCode).Render(statusText))
		if m.Width >= 80 {
			latStr := fmt.Sprintf("%dms", req.LatencyMs)
			cols = append(cols, LatencyStyle(req.LatencyMs).Render(latStr))
		}

		row := strings.Join(cols, "  ")
		rows = append(rows, RowStyle(alternate).Width(m.Width-2).Render(row))
	}

	return strings.Join(rows, "\n")
}

func (m Model) renderStatusBar() string {
	avgMs := 0
	if m.TotalReqs > 0 {
		avgMs = int(m.TotalLatMs / int64(m.TotalReqs))
	}

	left := CountStyle.Render(fmt.Sprintf("%d requests", m.TotalReqs)) +
		"   " +
		OkCountStyle.Render(fmt.Sprintf("%d ok", m.OkCount)) +
		"   " +
		ErrorCountStyle.Render(fmt.Sprintf("%d error", m.ErrorCount)) +
		"   " +
		AvgLatencyStyle.Render(fmt.Sprintf("avg %dms", avgMs))

	right := KeybindStyle.Render("q quit   c clear")

	gap := m.Width - lipgloss.Width(left) - lipgloss.Width(right) - 6
	if gap < 1 {
		gap = 1
	}

	content := left + strings.Repeat(" ", gap) + right
	return StatusBarStyle.Width(m.Width - 2).Render(content)
}
