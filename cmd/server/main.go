package main

import (
	"fmt"
	"log"
	"os"

	"github.com/pranav718/tunneru/internal/server"
	"github.com/spf13/cobra"
)

var (
	controlAddr string
	proxyAddr   string
	domain      string
)

var rootCmd = &cobra.Command{
	Use:   "tunneru-server",
	Short: "tunneru tunnel server: expose local ports to the internet",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("tunneru server v0.1.0")

		cs := server.NewControlServer(controlAddr, domain)
		proxy := server.NewHTTPProxy(proxyAddr, domain, cs.Registry())

		go func() {
			if err := proxy.Start(); err != nil {
				log.Fatalf("proxy server error: %v", err)
			}
		}()

		if err := cs.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "control server error: %v\n", err)
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.Flags().StringVar(&controlAddr, "control-addr", ":7001", "address for the control server")
	rootCmd.Flags().StringVar(&proxyAddr, "proxy-addr", ":8080", "address for the public HTTP proxy server")
	rootCmd.Flags().StringVar(&domain, "domain", "tunneru.dev", "base domain for tunnel URLs")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
